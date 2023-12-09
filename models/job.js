"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { id, title, salary, equity, company_handle }
     *
     * */

    static async create(data) {
        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
            [
                data.title,
                data.salary,
                data.equity,
                data.company_handle
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs or jobs that meet the specified criteria.
     *
     * Returns [{ id, title, salary, equity, company_handle }, ...]
     * */

    // static async findJobs({ id, title, minSalary, maxSalary, minEquity, maxEquity, company_handle }) {
    //     let whereStatement = '';
    //     let whereValues = [];

    //     if (id) {
    //         whereStatement += `id = $${whereValues.length + 1} AND `;
    //         whereValues.push(`%${id}%`);
    //     }

    //     if (title) {
    //         whereStatement += `LOWER(title) LIKE LOWER($${whereValues.length + 1}) AND `;
    //         whereValues.push(`%${title}%`);
    //     }

    //     if (minSalary) {
    //         whereStatement += `salary >= $${whereValues.length + 1} AND `;
    //         whereValues.push(minSalary);
    //     }

    //     if (maxSalary) {
    //         whereStatement += `salary <= $${whereValues.length + 1} AND `;
    //         whereValues.push(maxSalary);
    //     }

    //     if (minEquity) {
    //         whereStatement += `equity >= $${whereValues.length + 1} AND `;
    //         whereValues.push(minEquity);
    //     }

    //     if (maxEquity) {
    //         whereStatement += `equity <= $${whereValues.length + 1} AND `;
    //         whereValues.push(maxEquity);
    //     }

    //     if (company_handle) {
    //         whereStatement += `LOWER(company_handle) LIKE LOWER($${whereValues.length + 1}) AND `;
    //         whereValues.push(company_handle);
    //     }

    //     whereStatement = whereStatement.replace(/ AND $/, '');

    //     const jobsRes = await db.query(
    //         `SELECT id, 
    //             title, 
    //             salary, 
    //             equity, 
    //             company_handle
    //            FROM companies
    //            ${whereStatement ? `WHERE ${whereStatement}` : ''}
    //            ORDER BY name`,
    //         whereValues);
    //     return jobsRes.rows;
    // }

    static async findJobs({ minSalary, hasEquity, title } = {}) {
        let query = `SELECT j.id,
                            j.title,
                            j.salary,
                            j.equity,
                            j.company_handle AS "companyHandle",
                            c.name AS "companyName"
                     FROM jobs j 
                       LEFT JOIN companies AS c ON c.handle = j.company_handle`;
        let whereExpressions = [];
        let queryValues = [];

        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        }

        if (hasEquity === true) {
            whereExpressions.push(`equity > 0`);
        }

        if (title !== undefined) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
        }

        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ");
        }

        query += " ORDER BY title";
        const jobsRes = await db.query(query, queryValues);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        const companiesRes = await db.query(
            `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);

        delete job.companyHandle;
        job.company = companiesRes.rows[0];

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity,}
     *
     * Returns {id, title, salary, equity, company_handle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, title, salary, equity, company_handle AS companyHandle`;
        const result = await db.query(querySql, [...values, id]);
        const company = result.rows[0];

        if (!id) throw new NotFoundError(`No id: ${id}`);

        return company;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}


module.exports = Job;