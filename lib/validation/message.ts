import { z } from "zod";

// A thread message (task 3.16): one schema the sendMessage server action
// checks every time, since it's the only writer (the content CHECK in the
// migration is just VARCHAR(2000), an outer bound — this is the real limit
// a player sees).

export const MESSAGE_MAX = 2000;

export const messageContentSchema = z
  .string("Write a message.")
  .trim()
  .min(1, "Write a message.")
  .max(MESSAGE_MAX, `Keep messages under ${String(MESSAGE_MAX)} characters.`);
