

// export default defineCachedEventHandler(
//   async (event) => {
//     // ✅ User is already authenticated by middleware
//     const user = event.context.user;

//     // Get query parameters
//     const query = getQuery(event);
//     const date = query.date as string | undefined;

//     // Validate date parameter
//     if (!date) {
//       throw createError({
//         statusCode: 400,
//         message: "Date parameter is required (format: YYYY-MM-DD)",
//       });
//     }

//     // Validate date format
//     const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
//     if (!dateRegex.test(date)) {
//       throw createError({
//         statusCode: 400,
//         message: "Invalid date format. Use YYYY-MM-DD",
//       });
//     }

//     try {
//       // Fetch commits for the specified day
//       const commits = await fetchCommitsForDay(user.id, date);

//       return {
//         success: true,
//         date,
//         count: commits.length,
//         data: commits,
//       };
//     } catch (error: any) {
//       // Re-throw errors from the service
//       throw error;
//     }
//   },
//   {
//     // Cache key includes user ID and date
//     getKey: (event) => {
//       const user = event.context.user;
//       const query = getQuery(event);
//       return `github:commits:${user.id}:${query.date}`;
//     },
//     maxAge: 60 * 60, // 1 hour
//     swr: true,
//   },
// );
