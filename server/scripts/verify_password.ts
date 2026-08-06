import { PartenaireRepository } from '../src/modules/partenaires/partenaires.repository.js';
import { verify } from 'argon2';
import pool from '../src/database/db.js';

const repo = new PartenaireRepository();
const email = 'djeutchouruxel@gmail.com';
const password = 'Fillin237';

async function verifyPartner() {
    try {
        const partner = await repo.findByEmail(email);
        if (!partner) {
            console.log('Partner not found.');
            return;
        }
        if (!partner.mot_de_passe) {
            console.log('Password hash not found.');
            return;
        }

        const isValid = await verify(partner.mot_de_passe, password);
        console.log(`Password verification result for ${email}: ${isValid ? 'SUCCESS' : 'FAILURE'}`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.pool.end();
        process.exit(0);
    }
}

verifyPartner();
