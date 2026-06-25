import { z } from 'zod'

// Step 4: strict passenger validation.
// The legacy Saudia/FLYNAS forms threw `Undefined array key "data"` because
// the payload was read without checking that `data` (the passenger array)
// existed. Here the array is required and every row is validated, so a
// malformed/empty submission fails safely instead of 500-ing.
export const passengerSchema = z.object({
  title: z.enum(['Mr', 'Mrs', 'Ms', 'Mstr', 'Miss']).optional(),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  paxType: z.enum(['ADT', 'CHD', 'INF']).default('ADT'),
  dob: z.string().optional(),
  passportNo: z.string().optional(),
  passportExpiry: z.string().optional(),
  nationality: z.string().optional(),
})

export const passengerFormSchema = z.object({
  bookingId: z.string().uuid(),
  // The field that used to be read blindly as $_POST['data'].
  data: z.array(passengerSchema).min(1, 'At least one passenger is required'),
})

export type PassengerForm = z.infer<typeof passengerFormSchema>
