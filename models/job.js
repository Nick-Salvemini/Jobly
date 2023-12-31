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
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                data.title,
                data.salary,
                data.equity,
                data.companyHandle
            ],
        );
        const job = result.rows[0];
        return job;
    }

    /** Find all jobs or jobs that meet the specified criteria.
     *
     * Returns [{ id, title, salary, equity, company_handle }, ...]
     * */

    static async findJobs({ minSalary, hasEquity, title } = {}) {
        let whereStatement = '';
        let whereValues = [];

        if (minSalary !== undefined) {
            whereStatement += `salary >= $${whereValues.length + 1} AND `;
            whereValues.push(minSalary);
        }

        if (hasEquity) {
            whereStatement += `equity > 0 AND `;
        }

        if (title) {
            whereStatement += `title ILIKE $${whereValues.length + 1} AND `;
            whereValues.push(`%${title}%`);
        }

        whereStatement = whereStatement.replace(/ AND $/, '');

        const jobsRes = await db.query(
            `SELECT company_handle,
              equity,
              salary,
              title,
              id
       FROM jobs
       ${whereStatement ? `WHERE ${whereStatement}` : ''}
       ORDER BY title`,
            whereValues
        );
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
            `SELECT j.id,
                j.title,
                j.salary,
                j.equity,
                j.company_handle AS "companyHandle",
                c.handle AS "companyHandle",
                c.name AS "companyName",
                c.description AS "companyDescription",
                c.num_employees AS "companyNumEmployees",
                c.logo_url AS "companyLogoUrl"
         FROM jobs AS j
         JOIN companies AS c ON j.company_handle = c.handle
         WHERE j.id = $1`, [id]);

        const res = jobRes.rows[0];

        if (!res) throw new NotFoundError(`No job: ${id}`);

        const job = {
            id: res.id,
            title: res.title,
            salary: res.salary,
            equity: res.equity,
            company: {
                handle: res.companyHandle,
                name: res.companyName,
                description: res.companyDescription,
                numEmployees: res.companyNumEmployees,
                logoUrl: res.companyLogoUrl,
            }
        }

        return job
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
                          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);

        if (result.rows.length === 0) throw new NotFoundError(`No id: ${id}`);

        const job = result.rows[0];
        return job;
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