import re
from pypdf import PdfReader

def convert_pdf_to_sql(pdf_path, sql_path):
    reader = PdfReader(pdf_path)
    sql_statements = [
        "CREATE TABLE IF NOT EXISTS spanish_words (",
        "    id INTEGER PRIMARY KEY AUTOINCREMENT,",
        "    rank INTEGER,",
        "    word_en TEXT,",
        "    word_es TEXT,",
        "    gender TEXT",
        ");",
        "BEGIN TRANSACTION;"
    ]
    
    # Regex to match: Rank. English - Spanish - Gender
    # Example: 1. time - tiempo - masculine
    # Some lines might have variations like "masculine/feminine" or extra info
    pattern = re.compile(r"(\d+)\.\s+(.*?)\s+-\s+(.*?)\s+-\s+(.*)")
    
    count = 0
    for page in reader.pages:
        text = page.extract_text()
        if not text:
            continue
            
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            match = pattern.match(line)
            if match:
                rank = match.group(1)
                en = match.group(2).replace("'", "''")
                es = match.group(3).replace("'", "''")
                gender = match.group(4).replace("'", "''")
                
                sql = f"INSERT INTO spanish_words (rank, word_en, word_es, gender) VALUES ({rank}, '{en}', '{es}', '{gender}');"
                sql_statements.append(sql)
                count += 1
    
    sql_statements.append("COMMIT;")
    
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_statements))
    
    print(f"Successfully converted {count} entries to {sql_path}")

if __name__ == "__main__":
    convert_pdf_to_sql("2000.pdf", "spanish_words.sql")
