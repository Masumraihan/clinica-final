// import { FilterQuery, Query } from "mongoose";

// class QueryBuilder<T> {
//   public modelQuery: Query<T[], T>;
//   public query: Record<string, unknown>;

//   constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
//     this.modelQuery = modelQuery;
//     this.query = query;
//   }

//   search(searchableField: string[]) {
//     const searchTerm = this.query?.searchTerm;
//     if (searchTerm) {
//       this.modelQuery = this.modelQuery.find({
//         $or: searchableField.map(
//           (field) =>
//             ({
//               [field]: { $regex: searchTerm, $options: "i" },
//             }) as FilterQuery<T>,
//         ),
//       });
//     }
//     return this;
//   }

//   filter() {
//     const queryObj = { ...this.query };
//     const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
//     excludeFields.forEach((element) => {
//       delete queryObj[element];
//     });

//     this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);
//     return this;
//   }

//   sort() {
//     const sort = (this.query?.sort as string)?.split(",")?.join(" ") || "-createdAt";
//     this.modelQuery = this.modelQuery.sort(sort as string);
//     return this;
//   }

//   paginate() {
//     const limit = Number(this.query?.limit) || 10;
//     const page = Number(this.query?.page) || 1;
//     const skip = (page - 1) * limit;

//     this.modelQuery = this.modelQuery.skip(skip).limit(limit);
//     return this;
//   }
//   fields() {
//     const fields = (this.query?.fields as string)?.split(",")?.join(" ") || "-__v";
//     this.modelQuery = this.modelQuery.select(fields);
//     return this;
//   }

//   async countTotal() {
//     const totalQuery = this.modelQuery.getFilter();
//     const total = await this.modelQuery.model.countDocuments(totalQuery);
//     const limit = Number(this.query?.limit) || 10;
//     const page = Number(this.query?.page) || 1;
//     const totalPage = Math.ceil(total / limit);

//     return {
//       total,
//       limit,
//       page,
//       totalPage,
//     };
//   }
// }
// export default QueryBuilder;

import { FilterQuery, PipelineStage, Query, Model, Document } from "mongoose";

class QueryBuilder<T extends Document> {
  public modelQuery: Query<T[], T> | PipelineStage[] = [];
  public query: Record<string, unknown>;
  private model: Model<T>;

  constructor(model: Model<T>, modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.model = model; // Mongoose model
    this.modelQuery = modelQuery; // Mongoose query object
    this.query = query; // The user's input query (e.g., searchTerm, filters, etc.)
  }

  // Search method that handles both populated and non-populated fields
  search(searchableField: string[], searchablePopulatedField: {
    lookupFrom?: string;
    localField?: string;
    foreignField?: string;
    lookupAs?: string;
    populatedFields?: string[];
  }) {
    const searchTerm = this.query?.searchTerm as string;
    if (searchTerm) {
      if (searchablePopulatedField?.populatedFields?.length > 0 && searchablePopulatedField?.lookupFrom) {
        // If populated fields exist, you need to use aggregation
        const searchQuery: PipelineStage[] = [];

        // Main model search fields
        const mainModelSearch = searchableField
          .filter((field) => searchablePopulatedField?.populatedFields.includes(field)) // Exclude populated fields
          .map((field) => ({
            [field]: { $regex: searchTerm, $options: "i" },
          }));

        if (mainModelSearch.length > 0 && searchablePopulatedField?.lookupFrom) {
          searchQuery.push({
            $match: { $or: mainModelSearch },
          });
        }

        // Populated fields search (e.g., user.name)
        searchQuery.push(
          {
            $lookup: {
              from: searchablePopulatedField?.lookupFrom,
              localField: searchablePopulatedField?.localField,
              foreignField: searchablePopulatedField?.foreignField,
              as: searchablePopulatedField?.lookupAs,
            },
          },
          { $unwind: `${searchablePopulatedField?.lookupAs}` },
          {
            $match: {
              $or: searchablePopulatedField?.populatedFields.map((field) => ({
                [`user.${field}`]: { $regex: searchTerm, $options: "i" },
              })),
            },
          }
        );

        this.modelQuery = searchQuery;
      } else {
        // Regular find query for non-populated fields
        if (!(this.modelQuery instanceof Array)) {
          this.modelQuery = (this.modelQuery as Query<T[], T>).find({
            $or: searchableField.map((field) => ({
              [field]: { $regex: searchTerm, $options: "i" },
            })) as FilterQuery<T>[],
          });
        }
      }
    }
    return this;
  }

  // Filter method
  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
    excludeFields.forEach((element) => delete queryObj[element]);

    if (!(this.modelQuery instanceof Array)) {
      this.modelQuery = (this.modelQuery as Query<T[], T>).find(queryObj as FilterQuery<T>);
    }
    return this;
  }

  // Sorting method
  sort() {
    const sort = (this.query?.sort as string)?.split(",")?.join(" ") || "-createdAt";
    if (!(this.modelQuery instanceof Array)) {
      this.modelQuery = (this.modelQuery as Query<T[], T>).sort(sort);
    }
    return this;
  }

  // Pagination method
  paginate() {
    const limit = Number(this.query?.limit) || 10;
    const page = Number(this.query?.page) || 1;
    const skip = (page - 1) * limit;

    if (!(this.modelQuery instanceof Array)) {
      this.modelQuery = (this.modelQuery as Query<T[], T>).skip(skip).limit(limit);
    }
    return this;
  }

  // Field selection method
  fields() {
    const fields = (this.query?.fields as string)?.split(",")?.join(" ") || "-__v";
    if (!(this.modelQuery instanceof Array)) {
      this.modelQuery = (this.modelQuery as Query<T[], T>).select(fields);
    }
    return this;
  }

  // Execute the query (either aggregation or find)
  async exec() {
    if (Array.isArray(this.modelQuery)) {
      // If it's an aggregate query, execute aggregation
      return await this.model.aggregate(this.modelQuery as PipelineStage[]);
    } else {
      // If it's a regular find query, execute it
      return await (this.modelQuery as Query<T[], T>).exec();
    }
  }

  // Count total documents (for pagination purposes)
  async countTotal() {
    if (this.modelQuery instanceof Query) {
      const totalQuery = this.modelQuery.getFilter();
      const total = await this.model.countDocuments(totalQuery);
      const limit = Number(this.query?.limit) || 10;
      const page = Number(this.query?.page) || 1;
      const totalPage = Math.ceil(total / limit);

      return {
        total,
        limit,
        page,
        totalPage,
      };
    } else {
      // For aggregation pipelines, we need to calculate the total with a separate aggregation
      const totalPipeline: PipelineStage[] = [...(this.modelQuery as PipelineStage[]), { $count: "total" }];
      const result = await this.model.aggregate(totalPipeline);
      const total = result[0]?.total || 0;
      const limit = Number(this.query?.limit) || 10;
      const page = Number(this.query?.page) || 1;
      const totalPage = Math.ceil(total / limit);

      return {
        total,
        limit,
        page,
        totalPage,
      };
    }
  }
}

export default QueryBuilder;
