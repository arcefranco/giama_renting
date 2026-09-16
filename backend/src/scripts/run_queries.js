import fs from "fs";
import { execSync } from "child_process";

function run() {
    const queries = fs.readFileSync('/home/gaston/giama-proyectos/giama_renting/backend/scratch/queries.sql', 'utf8').split(';');
    
    let resultOutput = "";
    
    // Skip the first "USE giama_renting" and the last empty element
    for (let i = 1; i < queries.length; i++) {
        const query = queries[i].trim();
        if (!query) continue;
        
        try {
            const out = execSync(`mysql -h rds.giama.com.ar -u admin -pjuan1720 -D giama_renting -e "${query}"`, { stdio: 'pipe' }).toString();
            if (out) {
                resultOutput += out + "\n";
            }
        } catch (e) {
            console.error("Error with query:", query);
        }
    }
    
    fs.writeFileSync('/home/gaston/giama-proyectos/giama_renting/backend/scratch/results2.txt', resultOutput);
    console.log("Terminado. Resultados en results2.txt");
}

run();
