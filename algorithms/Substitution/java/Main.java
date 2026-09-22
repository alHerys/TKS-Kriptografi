import java.util.Scanner;

public class Main{
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        Substitution sb = new Substitution();
        System.out.println("====== SELAMAT DATANG DI SUBSTITUTION CIPHER ======");
        while(true){
            System.out.println("Silahkan pilih menu");
            System.out.println("1. Enkripsi");
            System.out.println("2. Dekripsi (Specific Key)");
            System.out.println("3. Dekripsi (General Key)");
            System.out.println("4. Generate new General Key");
            System.out.println("5. Exit");

            int jawab = input.nextInt();
            input.nextLine();

            switch(jawab){
                case 1: {
                    System.out.print("Masukan Plaintext: ");
                    String pt = input.nextLine().toUpperCase();
                    String ct = sb.enkripsi(pt);

                    System.out.printf("Enkripsi : %s%n",ct);
                    System.out.printf("Key      : %s%n",sb.key);
                    System.out.println();
                    break;
                }
                case 2: {
                    System.out.print("Masukan Chipertext: ");
                    String ct = input.nextLine();
                    System.out.print("Masukan Key (26 karakter): ");
                    String key = input.nextLine().toUpperCase();
                    if(key.length() > 26){
                        System.out.println("Error: Panjang key lebih dari 26");
                    } else {
                        String dt = sb.dekripsi(ct,key);
                        System.out.println();
                        System.out.printf("Enkripsi : %s%n",ct);
                        System.out.printf("Key      : %s%n",key);
                        System.out.printf("Dekripsi : %s%n",dt);
                        System.out.println();
                    }
                    break;
                }
                case 3: {
                    System.out.print("Masukan Chipertext: ");
                    String ct = input.nextLine();
                    if(sb.key.length() > 26){
                        System.out.println("Error: Panjang key lebih dari 26");
                        System.out.println();
                    } else {
                        String dt = sb.dekripsi(ct);
                        System.out.println();
                        System.out.printf("Enkripsi : %s%n",ct);
                        System.out.printf("Key      : %s%n",sb.key);
                        System.out.printf("Dekripsi : %s%n",dt);
                        System.out.println();
                    }
                    break;
                }
                case 4: {
                    sb.remakeKey();
                    System.out.printf("New Key   : %s%n",sb.key);
                    System.out.println();
                    break;
                }
                case 5:{
                    System.out.println("====== TERIMA KASIH ======");
                    return;
                }
            }

        }
    }
}