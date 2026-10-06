import baseApi from "../../baseApi";

const gameApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    upsertGame: builder.mutation({
      query: (gameData) => ({
        url: "/games/upsert",
        method: "POST",
        body: gameData,
      }),
      invalidatesTags: ["games"],
    }),

    updateGame: builder.mutation({
      query: ({ id, data }) => ({
        url: `/games/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["games"],
    }),

    getGames: builder.query({
      query: () => "/games",
      providesTags: ["games"],
    }),

    deleteGame: builder.mutation({
      query: (gameId) => ({
        url: `/games/${gameId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["games"],
    }),

    toggleGameStatus: builder.mutation({
      query: (gameId) => ({
        url: `/games/toggle-status/${gameId}`,
        method: "PATCH",
      }),
      invalidatesTags: ["games"],
    }),

    addGame: builder.mutation({
      query: (gameData) => ({
        url: "/games",
        method: "POST",
        body: gameData,
      }),
      invalidatesTags: ["games"],
    }),
  }),
});

export const {
  useAddGameMutation,
  useGetGamesQuery,
  useUpdateGameMutation,
  useDeleteGameMutation,
  useToggleGameStatusMutation,
  useUpsertGameMutation,
} = gameApi;
