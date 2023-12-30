import * as z from "zod";
export const eventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(400, "Must be less than 400"),
  location: z.string().min(3).max(400),
  imageUrl: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  categoryId: z.string(),
  price: z.string(),
  isFree: z.boolean(),
  url: z.string().url(),
});
