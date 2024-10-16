import { startOfDay, subWeeks, startOfWeek } from "date-fns";
import { WeightModel } from "../modules/weight/weight.model";
import { Model } from "mongoose";

// Function to calculate last Monday and second-last Monday
function getLastMondayToSecondLastMonday() {
  const today = new Date();

  // Get last Monday (subtract 1 week from today's Monday)
  const lastMonday = startOfWeek(today, { weekStartsOn: 1 }); // weekStartsOn: 1 means Monday

  // Get second-last Monday (subtract 2 weeks from today's Monday)
  const secondLastMonday = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

  return { lastMonday: startOfDay(lastMonday), secondLastMonday: startOfDay(secondLastMonday) };
}

async function getDataBetweenLastAndSecondLastMonday<T>(model: Model<T>) {
  const { lastMonday, secondLastMonday } = getLastMondayToSecondLastMonday();

  // Query MongoDB for weights between last Monday and second-last Monday
  const result = await WeightModel.aggregate([
    {
      // Project the original fields and convert the string "date" field to a Date object
      $project: {
        weight: 1,
        user: 1,
        date: {
          $dateFromString: {
            dateString: "$date",
            format: "%d-%m-%Y", // Your date format
          },
        },
        time: 1,
      },
    },
    {
      // Filter the records based on the converted date field
      $match: {
        date: {
          $gte: secondLastMonday,
          $lt: lastMonday,
        },
      },
    },
  ]);

  return result;
}

// Call the function to get data
export default getDataBetweenLastAndSecondLastMonday;
