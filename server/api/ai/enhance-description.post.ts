import { z } from 'zod'
import OpenAI from 'openai'
import { GitHubCommitSummarySchema } from '#shared/schemas/github/commits'
import { useServerLogger } from '~~/server/utils/logger'

const EnhanceDescriptionSchema = z.object({
  description: z.string().min(1).max(5000),
  commits: z.array(GitHubCommitSummarySchema).max(10).optional()
})

// Create client once, reused across requests
let aiClient: OpenAI | null = null

function getAIClient() {
  if (!aiClient) {
    const config = useRuntimeConfig()
    aiClient = new OpenAI({ apiKey: config.openaiApiKey })
  }
  return aiClient
}

export default defineEventHandler(async (event) => {
  const logger = useServerLogger('ai:enhance')
  const body = await readBody(event)
  const { description, commits } = EnhanceDescriptionSchema.parse(body)

  const client = getAIClient()

  const commitContext = (commits ?? []).map((commit, index) => {
    const when = new Date(commit.date).toISOString()
    return `${index + 1}. [${commit.shortSha}] ${commit.summary} (${commit.repo} @ ${when})\n${commit.message}`
  })

  const instructions = [
    'Verfassen Sie prägnante und effektive Arbeitszeitnotizen, indem Sie die vom Benutzer eingegebenen Aufgaben durch das Zeichen "|" trennen und in eine strukturierte Zusammenfassung umwandeln, die den Kundennutzen betont.',
    '- Trennung und Strukturierung: Verwenden Sie das Zeichen "|" um die Eingaben voneinander zu trennen.',
    '- Konzentration auf den Kundennutzen: Stellen Sie den Wert und Nutzen der erledigten Aufgaben für den Kunden in den Vordergrund.',
    '- Kürze und Klarheit: Halten Sie die Zusammenfassung präzise. Die Ausgabe darf NICHT länger als 1000 Zeichen sein.',
    '- Vorgabe zu Rollenformulierungen: Nutzen Sie die bekannten Formulierungen aus der Anhangsdatei. Wenn nichts angegeben ist, schreiben Sie neutral und professionell.',
    '',
    '# Output Format',
    '- Eine Auflistung der Aufgaben, die der Benutzer über den Tag verteilt erledigt hat, durch das Zeichen "|" getrennt.',
    '- Jeder Eintrag sollte den unmittelbaren Nutzen für den Kunden hervorheben.',
    '- Keine zusätzlichen Erläuterungen oder Bullet-Listen verwenden.',
    '',
    '# Beispiel',
    'Eingabe: Kundenanruf | Dokumentenvorbereitung | Projektbesprechung',
    'Ausgabe: Kundenanruf für direkte Problemlösung | Dokumentenvorbereitung zur Optimierung der Kundenkommunikation | Projektbesprechung zur Steigerung der Projektergebnisse',
    '',
    '# GitHub Commit Kontext',
    'Wenn Commit-Daten bereitgestellt werden, nutze sie ausschließlich als zusätzlichen Kontext, um die Kundenwirkung präziser zu beschreiben. Wiederhole die Commits nicht wörtlich, sondern integriere nur relevante Erkenntnisse in die zusammengefassten Aufgaben.'
  ].join('\n')

  const commitBlock = commitContext.length
    ? [
        '# Kontext: GitHub Commits (nur zur Orientierung, nicht erneut auflisten)',
        commitContext.join('\n\n')
      ].join('\n')
    : null

  const aiInput = [
    instructions,
    '# Nutzerbeschreibung',
    description,
    commitBlock
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const response = await client.responses.create({
      model: 'gpt-5-nano',
      input: aiInput
    })

    const enhanced = response.output_text?.trim()
    const usedToken = response.usage?.total_tokens || 0

    if (!enhanced) {
      logger.warn(
        {
          tokenUsage: usedToken,
          descriptionLength: description.length
        },
        'OpenAI returned an empty enhancement response'
      )
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to enhance description',
        message: 'OpenAI returned an empty response'
      })
    }

    logger.success(
      {
        tokenUsage: usedToken,
        descriptionLength: description.length,
        commitsAttached: commitContext.length
      },
      'Generated enhanced description'
    )

    return {
      enhanced,
      original: description,
      usedToken
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error')
    const statusCode = typeof (error as { statusCode?: number })?.statusCode === 'number'
      ? (error as { statusCode?: number }).statusCode
      : undefined

    logger.error(
      {
        message: err.message,
        statusCode,
        cause: err.cause,
        descriptionLength: typeof body?.description === 'string'
          ? body.description.length
          : undefined,
        commitsAttached: commits?.length
      },
      'OpenAI API error while enhancing description'
    )

    throw createError({
      statusCode: statusCode || 500,
      statusMessage: 'AI Enhancement Failed',
      message: err.message || 'Failed to enhance description'
    })
  }
})
