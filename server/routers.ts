import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  editor: router({
    assist: publicProcedure
      .input(z.object({
        prompt: z.string().min(1).max(1000),
        selectedId: z.string().max(120),
        selectedLabel: z.string().max(120),
        currentText: z.string().max(2000),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content: "You are the art director and copy editor for HoodWink, a Dhaka-born streetwear label. Return only the requested structured edit. Preserve the brand's understated, enigmatic, editorial tone. Do not invent new UI elements.",
            },
            {
              role: "user",
              content: `Selected element: ${input.selectedLabel} (${input.selectedId})\nCurrent text: ${input.currentText}\nUser request: ${input.prompt}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "hoodwink_edit",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  fontFamily: { type: "string" },
                  fontSize: { type: "number" },
                  color: { type: "string" },
                  letterSpacing: { type: "number" },
                },
                required: ["text", "fontFamily", "fontSize", "color", "letterSpacing"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message?.content;
        const parsed = JSON.parse(typeof content === "string" ? content : "{}");
        return { patch: parsed };
      }),
    generateImage: publicProcedure
      .input(z.object({ prompt: z.string().min(1).max(1000) }))
      .mutation(async ({ input }) => {
        const result = await generateImage({
          prompt: `HoodWink editorial fashion image, premium streetwear campaign, tactile fabric, deep ink black and forest green palette, restrained ochre accent, cinematic flash, art direction: ${input.prompt}`,
        });
        return { url: result.url };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
