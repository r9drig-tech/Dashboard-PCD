import os
import pandas as pd

def export_sheets_to_csv():
    excel_file = "01_gestao_pessoas_simulado.xlsx"
    out_dir = "Dashboard_RH"
    
    # Create directory if it doesn't exist
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
        print(f"Diretório '{out_dir}' criado com sucesso.")
    else:
        print(f"Diretório '{out_dir}' já existe.")

    # Load Excel file
    try:
        xl = pd.ExcelFile(excel_file)
    except Exception as e:
        print(f"Erro ao carregar o arquivo Excel '{excel_file}': {e}")
        return

    created_files = []

    for sheet in xl.sheet_names:
        # Standard header is at row 2 (index 1 in pandas, as index 0 is the title row)
        df = pd.read_excel(xl, sheet, header=1)
        
        # Strip string columns to avoid whitespace issues
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].astype(str).str.strip()

        # Remove rows that are entirely empty
        df = df.dropna(how='all')

        # Specific cleanups for each sheet
        if sheet == "Colaboradores":
            # Keep rows with valid numeric IDs
            df = df[pd.to_numeric(df['ID'], errors='coerce').notna()]
            df['ID'] = df['ID'].astype(int)
            # Clean numeric columns like Salário
            df['Salário (R$)'] = pd.to_numeric(df['Salário (R$)'], errors='coerce')
            
        elif sheet == "Movimentações":
            # Keep rows with valid numeric IDs
            df = df[pd.to_numeric(df['ID'], errors='coerce').notna()]
            df['ID'] = df['ID'].astype(int)
            
        elif sheet == "KPIs Mensais":
            # Drop rows without a valid month name
            df = df[df['Mês'].notna() & (df['Mês'] != 'nan')]
            # Ensure numeric columns are parsed
            for col in ['Headcount', 'Admissões', 'Desligamentos', 'Headcount Final']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
            if '% PCD' in df.columns:
                df['% PCD'] = pd.to_numeric(df['% PCD'], errors='coerce')
            if 'Turnover %' in df.columns:
                df['Turnover %'] = pd.to_numeric(df['Turnover %'], errors='coerce')

        elif sheet == "Resumo PCD":
            # Ignore empty rows or Legal Quota note
            df = df[df['Tipo de Deficiência'].notna() & (df['Tipo de Deficiência'] != 'nan')]
            df = df[~df['Tipo de Deficiência'].str.contains('Cota Legal', case=False, na=False)]
            # Ensure Qtd Colaboradores is numeric
            df['Qtd Colaboradores'] = pd.to_numeric(df['Qtd Colaboradores'], errors='coerce')
            df['% do Total PCD'] = pd.to_numeric(df['% do Total PCD'], errors='coerce')

        # File naming matches the sheet exactly
        csv_filename = f"{sheet}.csv"
        csv_path = os.path.join(out_dir, csv_filename)
        
        # Save as UTF-8 with standard comma separator
        df.to_csv(csv_path, index=False, encoding='utf-8-sig')
        created_files.append((csv_filename, len(df)))

    print("\n--- RESUMO DA EXPORTAÇÃO ---")
    print(f"Total de arquivos CSV gerados: {len(created_files)}")
    for f, count in created_files:
        print(f"- Arquivo criado: {f} ({count} registros exportados)")
    print("----------------------------\n")

if __name__ == "__main__":
    export_sheets_to_csv()
