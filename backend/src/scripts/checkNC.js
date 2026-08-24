import { pa7_giama_renting } from "../../helpers/connection.js";

const checkNC = async () => {
  try {
    const [result] = await pa7_giama_renting.query(
      `DESCRIBE c_movprov`
    );
    console.log(result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pa7_giama_renting.close();
  }
};

checkNC();
