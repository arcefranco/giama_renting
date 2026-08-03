import { importacionesTelepases } from './src/controllers/importacionesController.js';
import * as xlsx from 'xlsx';
import fs from 'fs';

// Mock express req, res
const req = {
    file: {
        buffer: fs.readFileSync('../frontend/public/Plantilla_Telepases.xlsx'),
        originalname: 'Plantilla_Telepases.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    user: { email: 'test@test.com' }
};

const res = {
    send: (data) => console.log(JSON.stringify(data, null, 2))
};

async function run() {
    await importacionesTelepases(req, res);
    process.exit();
}
run();
