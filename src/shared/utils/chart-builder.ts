/* eslint-disable @typescript-eslint/no-explicit-any */
type ChartItem = { [key: string]: any };

/**
 * Groups raw database records by a specific date field
 */
const groupByDate = (
  data: ChartItem[],
  dateField: string,
  valueField: string,
  dateFormat: "daily" | "monthly" = "daily",
) => {
  const grouped = data.reduce((acc: any, item) => {
    const date = new Date(item[dateField]);
    const key =
      dateFormat === "daily"
        ? date.toISOString().split("T")[0]
        : `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;

    acc[key] = (acc[key] || 0) + (item[valueField] || 0);
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
};

/**
 * Calculates percentage distribution for Pie Charts
 */
const getDistribution = (data: ChartItem[], categoryField: string) => {
  const counts = data.reduce((acc: any, item) => {
    const key = item[categoryField];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([label, count]) => ({ label, count }));
};

/**
 * Counts raw database records by a specific date field
 */
const countByDate = (
  data: ChartItem[],
  dateField: string,
  dateFormat: "daily" | "monthly" = "daily",
) => {
  const grouped = data.reduce((acc: any, item) => {
    const date = new Date(item[dateField]);
    const key =
      dateFormat === "daily"
        ? date.toISOString().split("T")[0]
        : `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;

    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
};

export const ChartBuilder = {
  groupByDate,
  getDistribution,
  countByDate,
};
