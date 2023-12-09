const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
    test("works: update with mapping", function () {
        const dataToUpdate = { firstName: "Aliya", age: 32 };
        const jsToSql = { firstName: "first_name", age: "user_age" };

        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(setCols).toBe('"first_name"=$1, "user_age"=$2');
        expect(values).toEqual(['Aliya', 32]);
    });

    test("throws BadRequestError: no data", function () {
        const emptyData = {};

        expect(() => sqlForPartialUpdate(emptyData)).toThrowError(BadRequestError);
    });
});