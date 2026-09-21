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
    # Create list of tuples: (character, original_index)
    indexed_key = [(char, i) for i, char in enumerate(key)]
    # Sort primarily by character, secondarily by original index
    sorted_key = sorted(indexed_key, key=lambda x: x[0])
    
    # Extract original indices in their sorted order
    order = [item[1] for item in sorted_key]
    return order


def encrypt(plaintext: str, key: str) -> str:
    """
    Encrypts plaintext using Columnar Transposition Cipher.
    """
    key = key.upper()
    num_cols = len(key)
    # Filter out spaces or keep them based on preference; here we keep letters/spaces
    plaintext = plaintext.replace(" ", "_") # Replace spaces with underscores for clarity
    
    num_rows = math.ceil(len(plaintext) / num_cols)
    
    # Pad plaintext with 'X' to fill the matrix completely
    padded_len = num_rows * num_cols
    plaintext += 'X' * (padded_len - len(plaintext))
    
    # Build grid row by row
    grid = []
    for r in range(num_rows):
        start = r * num_cols
        end = start + num_cols
        grid.append(list(plaintext[start:end]))
        
    # Get alphabetical column order
    col_order = get_keyword_order(key)
    
    # Read matrix column by column according to sorted key order
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
    
    # Create an empty grid
    grid = [['' for _ in range(num_cols)] for _ in range(num_rows)]
    
    # Fill the grid column by column using the keyword order
    cipher_idx = 0
    for col_idx in col_order:
        for r in range(num_rows):
            if cipher_idx < len(ciphertext):
                grid[r][col_idx] = ciphertext[cipher_idx]
                cipher_idx += 1
                
    # Read grid row by row to reconstruct plaintext
    plaintext = []
    for r in range(num_rows):
        plaintext.append("".join(grid[r]))
        
    decrypted_str = "".join(plaintext)
    
    # Replace underscores back to spaces and strip trailing padding 'X's
    decrypted_str = decrypted_str.replace("_", " ").rstrip('X')
    return decrypted_str