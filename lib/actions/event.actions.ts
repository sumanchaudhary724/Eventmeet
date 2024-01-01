"use server";
import {
  CreateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
  UpdateEventParams,
} from "@/types";
import { connectToDatabase } from "../mongodb/database";
import { handleError } from "../utils";
import User from "../mongodb/database/models/user.model";
import Event from "../mongodb/database/models/event.model";
import Category from "../mongodb//database/models/category.model";
import { revalidatePath } from "next/cache";

const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: "i" } });
};
const populateEvent = async (query: any) => {
  return query
    .populate({
      path: "organizer",
      model: User,
      select: "_id firstName lastName",
    })
    .populate({
      path: "category",
      model: Category,
      select: "_id name",
    });
};
export async function createEvent({ event, userId, path }: CreateEventParams) {
  try {
    await connectToDatabase();
    const organizer = await User.findById(userId);

    if (!organizer) throw new Error("organiser not found");
    const newEvent = await Event.create({
      ...event,

      category: event.categoryId,
      organizer: userId,
    });
    revalidatePath(path);
    return JSON.parse(JSON.stringify(newEvent));
  } catch (error) {
    console.log(error);
    handleError(error);
  }
}

export const getEventById = async (eventId: string) => {
  try {
    await connectToDatabase();
    const event = await populateEvent(Event.findById(eventId));
    return JSON.parse(JSON.stringify(event));
  } catch (error) {
    handleError(error);
  }
};
export const getAllEvents = async ({
  query,
  limit,
  page,
  category,
}: GetAllEventsParams) => {
  try {
    await connectToDatabase();

    const titleCondition = query
      ? { title: { $regex: query, $options: "i" } }
      : {};
    const categoryCondition = category
      ? await getCategoryByName(category)
      : null;
    const conditions = {
      $and: [
        titleCondition,
        categoryCondition ? { category: categoryCondition._id } : {},
      ],
    };

    const skipAmount = (Number(page) - 1) * limit;
    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);
    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPage: Math.ceil(eventsCount / limit),
    };
  } catch (error) {
    handleError(error);
  }
};

export const deleteEvent = async ({ eventId, path }: DeleteEventParams) => {
  try {
    await connectToDatabase();
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (deletedEvent) revalidatePath(path);
    return JSON.parse(JSON.stringify(event));
  } catch (error) {
    handleError(error);
  }
};

export async function updateEvent({ event, userId, path }: UpdateEventParams) {
  try {
    await connectToDatabase();
    const organizer = await User.findById(userId);

    if (!organizer) throw new Error("organiser not found");
    const newEvent = await Event.findByIdAndUpdate(
      event._id,
      { ...event, category: event.categoryId },
      {
        new: true,
      }
    );
    revalidatePath(path);
    return JSON.parse(JSON.stringify(newEvent));
  } catch (error) {
    console.log(error);
    handleError(error);
  }
}

export async function getRelatedEventsByCategory({
  categoryId,
  eventId,
  limit = 3,
  page = 1,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;
    const conditions = {
      $and: [{ category: categoryId }, { _id: { $ne: eventId } }],
    };

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
    };
  } catch (error) {
    handleError(error);
  }
}
export async function getEventByUser({ userId, page }: GetEventsByUserParams) {
  try {
    await connectToDatabase();
    if (!userId) throw new Error("User is must be passed");

    const events = await populateEvent(Event.find({ organizer: userId }));
    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: 1,
    };
  } catch (error) {
    handleError(error);
  }
}
