"""
transposition.py
Contains functions for Columnar Transposition Cipher Encryption and Decryption.
"""

import math

def get_keyword_order(key: str) -> list[int]:
    """
    Returns the column ordering based on the alphabetical order of key characters.
    Example: key = "MEGABUCK" -> returns index order based on sorted characters.
    """
    # Mengidekskan Karakter
    indexed_key = [(char, i) for i, char in enumerate(key)]
    # Urutkan berdasarkan karakter 
    sorted_key = sorted(indexed_key, key=lambda x: x[0])
    
    # Memberikan urutan kepada Cipher/Plain text
    order = [item[1] for item in sorted_key]
    return order


def encrypt(plaintext: str, key: str) -> str:
    """
    Encrypts plaintext using Columnar Transposition Cipher.
    """
    key = key.upper()
    num_cols = len(key)
    #Ngefilter spasi, cuman kita tidak usah ngefilter spasi tapi menggantikannya dengan _
    plaintext = plaintext.replace(" ", "_") 
    
    num_rows = math.ceil(len(plaintext) / num_cols)
    
    # Kasih x pada sisa kolom pada matriks di plaintext
    padded_len = num_rows * num_cols
    plaintext += 'X' * (padded_len - len(plaintext))
    
    # Buat matriks dari baris ke baris
    grid = []
    for r in range(num_rows):
        start = r * num_cols
        end = start + num_cols
        grid.append(list(plaintext[start:end]))
        
    # dapat urutan penyusunan matriks
    col_order = get_keyword_order(key)
    
    # baca matriks dari kolom per kolom dengan urutan daripada col_order
    ciphertext = []
    for col_idx in col_order:
        for row in grid:
            ciphertext.append(row[col_idx])
            
    return "".join(ciphertext)


def decrypt(ciphertext: str, key: str) -> str:
    """
    Decrypts ciphertext using Columnar Transposition Cipher.
    """
    key = key.upper()
    num_cols = len(key)
    num_rows = math.ceil(len(ciphertext) / num_cols)
    
    col_order = get_keyword_order(key)
    
    # buat matriks kosong sebesar secret key
    grid = [['' for _ in range(num_cols)] for _ in range(num_rows)]
    
    # isi matriks dari kolom per kolom menggunakan cipher text 
    cipher_idx = 0
    for col_idx in col_order:
        for r in range(num_rows):
            if cipher_idx < len(ciphertext):
                grid[r][col_idx] = ciphertext[cipher_idx]
                cipher_idx += 1
                
    # bada dari kolom per kolom untuk konstruksi plain text
    plaintext = []
    for r in range(num_rows):
        plaintext.append("".join(grid[r]))
        
    decrypted_str = "".join(plaintext)
    
    # ganti _ dan hapus X yang mengisi ciphertext.
    decrypted_str = decrypted_str.replace("_", " ").rstrip('X')
    return decrypted_str
