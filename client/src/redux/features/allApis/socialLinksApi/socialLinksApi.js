import baseApi from "../../baseApi";

const socialLinksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSocialLinks: builder.query({
      query: () => "/social-links",
      providesTags: ["socialLinks"],
    }),
    updateSocialLinks: builder.mutation({
      query: (data) => ({
        url: "/social-links",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["socialLinks"],
    }),
  }),
});

export const { useGetSocialLinksQuery, useUpdateSocialLinksMutation } = socialLinksApi;
