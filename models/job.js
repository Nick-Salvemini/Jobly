"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
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

    static async create({ title, salary, equity, company_handle }) {
        const result = await db.query(
            `INSERT INTO companies
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                company_handle
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs or jobs that meet the specified criteria.
     *
     * Returns [{ id, title, salary, equity, company_handle }, ...]
     * */

    static async findJobs({ id, title, minSalary, maxSalary, minEquity, maxEquity, company_handle }) {
        let whereStatement = '';
        let whereValues = [];

        if (id) {
            whereStatement += `id = $${whereValues.length + 1} AND `;
            whereValues.push(`%${id}%`);
        }

        if (title) {
            whereStatement += `LOWER(title) LIKE LOWER($${whereValues.length + 1}) AND `;
            whereValues.push(`%${title}%`);
        }

        if (minSalary) {
            whereStatement += `salary >= $${whereValues.length + 1} AND `;
            whereValues.push(minSalary);
        }

        if (maxSalary) {
            whereStatement += `salary <= $${whereValues.length + 1} AND `;
            whereValues.push(maxSalary);
        }

        if (minEquity) {
            whereStatement += `equity >= $${whereValues.length + 1} AND `;
            whereValues.push(minEquity);
        }

        if (maxEquity) {
            whereStatement += `equity <= $${whereValues.length + 1} AND `;
            whereValues.push(maxEquity);
        }

        if (company_handle) {
            whereStatement += `LOWER(company_handle) LIKE LOWER($${whereValues.length + 1}) AND `;
            whereValues.push(company_handle);
        }

        whereStatement = whereStatement.replace(/ AND $/, '');

        const jobsRes = await db.query(
            `SELECT id, 
                title, 
                salary, 
                equity, 
                company_handle AS "companyHandle"
               FROM companies
               ${whereStatement ? `WHERE ${whereStatement}` : ''}
               ORDER BY name`,
            whereValues);
        return jobsRes.rows;
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
            {
                title: "title",
                salary: "salary",
                equity: "equity",
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE companies 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, handle]);
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