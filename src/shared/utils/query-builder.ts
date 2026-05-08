/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

export class PrismaQueryBuilder<T> {
  public query: Record<string, any>;
  public prismaQuery: {
    where: Record<string, any>;
    orderBy: Record<string, any>;
    skip?: number;
    take?: number;
    include?: Record<string, any>;
  };

  constructor(query: Record<string, any>) {
    this.query = query;
    this.prismaQuery = {
      where: {},
      orderBy: { createdAt: "desc" },
    };
  }

  // 1. Search Logic (Handles the "Search Bar" requirement)
  search(searchableFields: string[]) {
    const searchTerm = this.query.search as string;
    if (searchTerm) {
      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        OR: searchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      };
    }
    return this;
  }

  // 2. Filter Logic (Exact matches: cuisine, difficulty, etc.)
  filter(
    excludeFields: string[] = [
      "search",
      "page",
      "limit",
      "sortBy",
      "sortOrder",
    ],
  ) {
    const queryObj = { ...this.query };
    excludeFields.forEach((field) => delete queryObj[field]);

    if (Object.keys(queryObj).length > 0) {
      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        ...queryObj,
      };
    }
    return this;
  }

  // 3. Sort Logic
  sort() {
    const sortBy = (this.query.sortBy as string) || "createdAt";
    const sortOrder = (this.query.sortOrder as string) || "desc";

    this.prismaQuery.orderBy = {
      [sortBy]: sortOrder,
    };
    return this;
  }

  // 4. Pagination Logic
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;
    return this;
  }

  // 5. Relations (If you need to include author/reviews)
  include(includeObj: Record<string, any>) {
    this.prismaQuery.include = includeObj;
    return this;
  }

  // Final structured query for Prisma findMany
  build() {
    return this.prismaQuery;
  }

  // Query for Prisma count (Dashboard/Numeric numbers)
  // We remove skip, take, orderBy, and include because .count() only accepts 'where'
  buildCount() {
    return { where: this.prismaQuery.where };
  }
}
