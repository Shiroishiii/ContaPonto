
import prisma from "./src/config/database.js";

async function main() {
    const companies = await prisma.company.findMany({
        select: {
            id: true,
            name: true,
        },
    });

    console.log("\nEMPRESAS CADASTRADAS:\n");
    console.table(companies);

    const employees = await prisma.employee.findMany({
        select: {
            id: true,
            companyId: true,
            fullName: true,
            employeeCode: true,
            status: true,
        },
    });

    console.log("\nTODOS OS FUNCIONÁRIOS:\n");
    console.table(employees);

    if (employees.length === 0) {
        console.log("\nNenhum funcionário cadastrado no banco conectado.");
    }
}

main()
    .catch((error) => {
        console.error("ERRO:", error.message);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
