from decimal import Decimal
from datetime import datetime, timezone
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.database.db import SessionLocal
from app.models.food import Food
from app.models.users import Users


FOODS = [
    ("Pão de forma plusvita", "100", "256", "49", "8,8", "2,7"),
    ("Abacate", "100", "96", "6", "1,2", "12"),
    ("Açucar", "100", "400", "100", "0", "0"),
    ("Arroz", "100", "128", "28", "2,5", "0"),
    ("Arroz parboilizado", "100", "168", "33", "2,9", "2,4"),
    ("Aveia Quaker", "100", "376", "58", "14", "2,3"),
    ("Azeite", "100", "819", "0", "0", "91"),
    ("Banana Prata", "100", "98", "26", "1,3", "0"),
    ("Batata doce Cozida", "100", "77", "18,4", "0,6", "0,1"),
    ("Batata frita", "100", "214", "31", "3", "8"),
    ("Batata Inglesa Cozida", "100", "86", "20", "1,71", "0,1"),
    ("Batata Inglesa Frita", "100", "280", "36", "4,3", "13,2"),
    ("Bife de boi à milanesa", "100", "273", "7", "26", "15"),
    ("Carne Moída Bovina", "100", "250", "0", "23", "16"),
    ("Cenoura Cozida", "100", "30", "6,7", "0,8", "0,2"),
    ("Clara de ovo", "100", "46", "0,73", "10,9", "0,17"),
    ("Contra-file bovino", "100", "260", "0", "21", "19"),
    ("Costela de porco", "100", "402", "0", "30,2", "30,3"),
    ("Coxa de frango com pele cozida", "100", "204", "0", "25,32", "10,64"),
    ("Creatina Growth", "5", "0", "0", "0", "0"),
    ("Creme de Leite", "100", "166", "4,8", "3", "15"),
    ("Crepioca", "1", "149,12", "17,79", "6,72", "5,49"),
    ("Farinha de Arroz", "100", "359", "78", "9,5", "0,8"),
    ("Farinha láctea", "30", "122", "22", "3,8", "1,9"),
    ("Farofa de farinha de mandioca", "100", "406", "80,3", "2,1", "9,1"),
    ("Feijão", "100", "67", "9,7", "5,1", "0,8"),
    ("File de Peito", "100", "101", "0", "22", "1,4"),
    ("Frango a passarinho", "100", "112", "0", "16", "5,4"),
    ("Frango, peito, sem pele, grelhado", "100", "159", "0", "32", "2,5"),
    ("Hamburger Texas", "100", "201", "1,7", "15", "15"),
    ("Iogurte Integral Grego", "100", "114", "14", "4,8", "4,4"),
    ("Iogurte verde campo whey", "100", "51", "5,5", "6", "0,5"),
    ("Leite Condensado Piracanjuba", "100", "314", "57", "8", "6"),
    ("Leite elegê", "100", "57", "4,5", "3", "3"),
    ("Leite em pó Petit Formagio", "26", "130", "9,7", "6,8", "7,1"),
    ("Leite Quatá", "100", "62", "4,6", "3,5", "3,3"),
    ("Linguiça calabresa", "50", "156", "0", "8,5", "14"),
    ("Linguiça de porco", "100", "245", "0", "18,3", "18,5"),
    ("Linguiça Toscana", "100", "188", "2,8", "16,6", "12,2"),
    ("Macarrão parafuso", "100", "174", "37", "5,1", "0,5"),
    ("Maionese hellmans", "100", "304", "6,7", "0,6", "30"),
    ("monster mango c/açucar", "1", "236", "61", "0", "0"),
    ("Monster Tradicional", "100", "36", "9,2", "0", "0"),
    ("Ovo Cozido", "100", "146", "0,5", "13,3", "9,5"),
    ("Ovo cru", "100", "142", "0,7", "12", "9,8"),
    ("Ovo frito", "100", "240", "1,2", "15", "18"),
    ("Pão de alho", "100", "305", "42", "7,2", "12"),
    ("Pão Francês", "50", "140", "28", "4", "1,5"),
    ("Parmalat Fit whey", "100", "53", "5", "6,1", "0,9"),
    ("Pasta de amendoim", "100", "584", "20", "27", "44"),
    ("Purê de batata", "100", "123", "15", "2,1", "6,1"),
    ("Queijo Prato", "30", "109", "0", "4,5", "8,8"),
    ("Refeição livre", "1", "1500", "0", "0", "0"),
    ("Salada de Maionese", "100", "195", "14", "1,5", "15"),
    ("Salsicha Seara", "50", "113", "2", "6", "9"),
    ("Salsicha Supermarket", "60", "118", "2", "8", "9,5"),
    ("Suco Integral uva", "100", "66", "16", "0", "0"),
    ("Tapioca Chinezinho", "100", "249", "61", "1,1", "0"),
    ("Tapioca goma", "100", "232", "58", "0", "0"),
    ("Whey protein growth", "30", "124", "2,3", "24", "2,1"),
    ("Brigadeiro caseiro", "542", "1660", "251,29", "35,35", "56,8"),
    ("Creme de leite piracanjuba", "100", "166", "4,6", "3,1", "15"),
    ("Nescau", "20", "76", "17", "0,6", "0,4"),
    ("Manteiga Qualy", "100", "722", "0,4", "0", "80"),
    ("Acém", "100", "137", "0", "19,4", "5,9"),
    ("Tapioca sacolão", "100", "232", "58", "0", "0"),
    ("Batata Baroa", "100", "80", "18,9", "0,9", "0,2"),
    ("Alcatra", "100", "241", "0", "31,9", "11,6"),
    ("Lasanha Sadia Bolonhesa", "100", "125", "10", "8,6", "5,6"),
    ("Iogurte Batavo Zero", "100", "26", "3,6", "2,8", "0"),
    ("Pescada, filé, com farinha de trigo, frito", "100", "283", "5", "21,4", "19,1"),
    ("Neston", "100", "372", "70", "13", "2,3"),
    ("Farinha de arroz NaturalLife", "100", "351", "80", "3,5", "0"),
    ("Frango a milanesa", "100", "221", "7,5", "28,5", "7,8"),
    ("Carne, bovina, fígado, grelhado", "100", "225", "4,2", "29,9", "9"),
    ("Nugget Seara Tekitos", "100", "235", "15", "10", "15"),
    ("Mandioca", "100", "125", "30,1", "0,6", "0,3"),
    ("Carne, bovina, seca, cozida", "100", "313", "0", "26,9", "21,9"),
    ("Sardinha, frita", "100", "257", "0", "33,4", "12,7"),
    ("Chuchu, cozido", "100", "19", "4,8", "0,4", "0"),
    ("Pão de forma integral", "100", "273", "41", "11", "3,4"),
    ("Porco, bisteca, grelhada", "100", "280", "0", "28,9", "17,4"),
    ("Porco, lombo, assado", "100", "210", "0", "35,7", "6,4"),
    ("Moela", "100", "154", "0", "30,38", "2,68"),
    ("Camarão, Rio Grande, grande, cozido", "100", "90", "0", "19", "1"),
    ("Carne Moída de primeira", "100", "180", "0", "26", "8"),
    ("Tilápia", "100", "96", "0", "20", "1,7"),
    ("Angu", "100", "124", "26,2", "3,3", "0,7"),
]


def decimal_from_pt_br(value):
    return Decimal(value.strip().replace(",", "."))


def seed_foods():
    created = 0
    updated = 0

    with SessionLocal() as db:
        dev_user = db.query(Users).filter(Users.id == 1).first()
        if dev_user is None:
            db.add(
                Users(
                    id=1,
                    username="local",
                    role="USER",
                    created_at=datetime.now(timezone.utc),
                )
            )

        for name, base_quantity, calories, carbs, protein, lipids in FOODS:
            normalized_name = name.strip()
            food = db.query(Food).filter(Food.name == normalized_name).first()
            values = {
                "base_quantity": decimal_from_pt_br(base_quantity),
                "calories": decimal_from_pt_br(calories),
                "carbs": decimal_from_pt_br(carbs),
                "protein": decimal_from_pt_br(protein),
                "lipids": decimal_from_pt_br(lipids),
            }

            if food is None:
                db.add(Food(name=normalized_name, **values))
                created += 1
                continue

            for field_name, value in values.items():
                setattr(food, field_name, value)
            updated += 1

        db.commit()

    return created, updated


if __name__ == "__main__":
    created_count, updated_count = seed_foods()
    print(f"Seed concluído: {created_count} criados, {updated_count} atualizados.")
