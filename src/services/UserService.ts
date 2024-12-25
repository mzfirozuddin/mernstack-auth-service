import { Brackets, Repository } from "typeorm";
import { User } from "../entity/User";
import { LimitedUserData, UserData, UserQueryParams } from "../types";
import createHttpError from "http-errors";
import bcrypt from "bcryptjs";

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    }: UserData) {
        //: check user already register or not
        const user = await this.userRepository.findOne({
            where: { email: email },
        });

        if (user) {
            const err = createHttpError(400, "Email is already exist!");
            throw err;
        }

        //: Hash the password
        const saltRoundes = 10;
        const hashedPassword = await bcrypt.hash(password, saltRoundes);

        try {
            // We have to save and return
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                tenant: tenantId ? { id: tenantId } : undefined,
            });
        } catch (err) {
            const error = createHttpError(
                500,
                "Failed to store the data in the database.",
            );
            throw error;
        }
    }

    async findByEmail(email: string) {
        //: check email is already present in DB or not.
        const user = await this.userRepository.findOne({
            where: { email },
        });

        return user;
    }

    async findByEmailWithPassword(email: string) {
        //: check email is already present in DB or not.
        const user = await this.userRepository.findOne({
            where: { email },
            select: [
                "id",
                "firstName",
                "lastName",
                "email",
                "role",
                "password",
            ],
        });

        return user;
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id },
            relations: { tenant: true },
        });
    }

    async update(
        userId: number,
        { firstName, lastName, role }: LimitedUserData,
    ) {
        try {
            return await this.userRepository.update(userId, {
                firstName,
                lastName,
                role,
            });
        } catch (err) {
            const error = createHttpError(
                500,
                "Failed to update the user in database!",
            );
            throw error;
        }
    }

    async getAll(validatedQuery: UserQueryParams) {
        // return await this.userRepository.find(); //! Problem

        //: Add Pagination
        const queryBuilder = this.userRepository.createQueryBuilder("user"); //+ Here "user" is alise name for sql search

        //: prepare queryBuilder for search functionality
        //* For search string
        if (validatedQuery.q) {
            const searchTerm = `%${validatedQuery.q}%`;
            queryBuilder.where(
                //: Brackets is used when we group some query together
                new Brackets((qb) => {
                    //+ ":q" is placeholder, here we are useing typeOrm
                    //+ Here we concat firstName and lastName and then search
                    qb.where(
                        "CONCAT(user.firstName, ' ', user.lastName) ILike :q",
                        { q: searchTerm },
                    ).orWhere("user.email ILike :q", { q: searchTerm });

                    //---------- Without concat ----------------
                    // qb.where("user.firstName ILike :q", {
                    //     q: searchTerm,
                    // })
                    //     .orWhere("user.lastName ILike :q", { q: searchTerm })
                    //     .orWhere("user.email ILike :q", { q: searchTerm });
                }),
            );
        }
        //- ================================================================
        //! This query is not work for our case because we need to group below query. For reference we keep this
        // if (validatedQuery.q) {
        //     const searchTerm = `%${validatedQuery.q}%`;
        //     queryBuilder
        //         .where("user.firstName ILike :q", { q: searchTerm }) //+ ":q" is placeholder, here we use typeOrm
        //         .orWhere("user.lastName ILike :q", { q: searchTerm })
        //         .orWhere("user.email ILike :q", { q: searchTerm });
        // }
        //- ===========================================================

        //* For role
        if (validatedQuery.role) {
            queryBuilder.andWhere("user.role = :role", {
                role: validatedQuery.role,
            });
        }

        const result = await queryBuilder
            .leftJoinAndSelect("user.tenant", "tenant") //- Doing left join "user.tenantId" with "tenant.id" (2nd parameter is tenant alias name, you can give it anything)
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .take(validatedQuery.perPage)
            .orderBy("user.id", "DESC")
            .getManyAndCount();

        // console.log(result);
        // console.log(queryBuilder.getSql());
        // SELECT "user"."id" AS "user_id", "user"."firstName" AS "user_firstName", "user"."lastName" AS "user_lastName", "user"."email" AS "user_email", "user"."role" AS "user_role", "user"."tenantId" AS "user_tenantId" FROM "users" "user" WHERE "user"."firstName" ILike $1 OR "user"."lastName" ILike $1 OR "user"."email" ILike $1 AND "user"."role" = $2 LIMIT 3
        return result;
    }

    async deleteById(userId: number) {
        try {
            return await this.userRepository.delete(userId);
        } catch (err) {
            const error = createHttpError(
                500,
                "Failed to delete the user from database!",
            );
            throw error;
        }
    }
}
