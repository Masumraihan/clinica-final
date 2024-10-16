import { WeightModel } from "./weight.model";

// Helper to calculate BMI
export const calculateBMI = (weight: number, height: number): number => {
  return weight / (height * height);
};

// Helper to get daily mean weight
export const getDailyMeanWeight = async (userId: any, today: Date, tomorrow: Date) => {
  return await WeightModel.aggregate([
    { $match: { user: userId, date: { $gte: today, $lt: tomorrow } } },
    { $group: { _id: null, avgWeight: { $avg: "$weight" } } },
  ]);
};

// Helper to get weekly average weight
export const getWeeklyAvgWeight = async (userId: any, today: Date) => {
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);
  return await WeightModel.aggregate([
    { $match: { user: userId, date: { $gte: lastWeek, $lt: today } } },
    { $group: { _id: null, avgWeight: { $avg: "$weight" } } },
  ]);
};

// Helper to get monthly average weight
export const getMonthlyAvgWeight = async (userId: any, today: Date) => {
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);
  return await WeightModel.aggregate([
    { $match: { user: userId, date: { $gte: lastMonth, $lt: today } } },
    { $group: { _id: null, avgWeight: { $avg: "$weight" } } },
  ]);
};

// Helper to get overall average weight
export const getOverallAvgWeight = async (userId: any) => {
  return await WeightModel.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, avgWeight: { $avg: "$weight" } } },
  ]);
};

export const getDataBetweenLastAndSecondLastMonday = async (model: any) => {
  const today = new Date();
  const lastMonday = new Date(today.setDate(today.getDate() - ((today.getDay() + 6) % 7))); // Last Monday
  const secondLastMonday = new Date(lastMonday);
  secondLastMonday.setDate(lastMonday.getDate() - 7); // Monday before last Monday

  const result = await model.aggregate([
    {
      $match: {
        date: {
          $gte: secondLastMonday,
          $lt: lastMonday,
        },
      },
    },
    {
      $group: {
        _id: null,
        avgWeight: { $avg: "$weight" },
      },
    },
  ]);

  return result.length > 0 ? result[0] : null;
};