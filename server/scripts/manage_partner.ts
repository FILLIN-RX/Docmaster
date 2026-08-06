import { PartenaireRepository } from '../src/modules/partenaires/partenaires.repository.js';
import { hash } from 'argon2';
import { pool } from '../src/database/db.js';

const repo = new PartenaireRepository();
const email = 'djeutchouruxel@gmail.com';
const password = 'Fillin237';

async function main() {
    try {
        const existing = await repo.findByEmail(email);
        if (existing) {
            await repo.delete(existing.id);
            console.log(`Deleted existing partner with ID: ${existing.id}`);
        }

        const hashedPassword = await hash(password);
        const newPartner = await repo.create({
            nom_organisation: 'Partenaire Test',
            email: email,
            mot_de_passe: hashedPassword,
            telephone: '600000000',
            nom_contact: 'Test',
            prenom_contact: 'Partner'
        });
        console.log(`Created new partner with ID: ${newPartner.id}`);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
