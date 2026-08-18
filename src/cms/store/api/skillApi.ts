// /src/store/api/skillApi.ts
/**
 * Skill Management API Endpoints
 * Admin organization management
 */
import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/core/types";
import type { Skill, SkillCreateData, SkillQueryParams, SkillUpdateData } from "@/cms/types/skill";

export const skillApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // POST api/v1/skill/add
    createSkill: builder.mutation<ApiResponse<Skill>, SkillCreateData>({
      query: data => ({
        url: "/skill/add",
        method: "POST",
        body: data,
      }),
      // providesTags: ["Skill"],
    }),

    // GET api/v1/skill
    getSkill: builder.query<ApiResponse<Skill[]>, SkillQueryParams>({
      query: params => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/skill?${searchParams.toString()}`;
      },
      // providesTags: ["Skill"],
    }),

    // GET api/v1/skill/{id}
    getSkillById: builder.query<ApiResponse<Skill>, string>({
      query: id => `/skill/${id}`,
      // providesTags: ["Skill"],
    }),

    // PATCH api/v1/skill/{id}
    updateSkill: builder.mutation<ApiResponse<Skill>, { id: string; data: SkillUpdateData }>({
      query: ({ id, data }) => ({
        url: `/skill/${id}`,
        method: "PATCH",
        body: data
      }),
      // providesTags: ["Skill"],
    }),

    // DELETE api/v1/skill/{id}
    deleteSkill: builder.mutation<ApiResponse<void>, string>({
      query: id => ({
        url: `/skill/${id}`,
        method: "DELETE"
      }),
      // providesTags: ["Skill"],
    }),
  }),
});

export const {
  useCreateSkillMutation,
  useGetSkillQuery,
  useGetSkillByIdQuery,
  useUpdateSkillMutation,
  useDeleteSkillMutation,
} = skillApi;
