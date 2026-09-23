import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Substitution{
    public static final String FINAL_STRING = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public String key;
    private String ct;

    public Substitution(){
        this.key = generateKey();
        this.ct = "";
    }

    public String enkripsi(String pt){
        String prePt = pt.toUpperCase();
        StringBuilder result = new StringBuilder();

        for(int i = 0; i < prePt.length(); i++){
            char curr = prePt.charAt(i);

            int index = FINAL_STRING.indexOf(curr);

            if(index != -1){
                result.append(this.key.charAt(index));
            } else {
                result.append(curr);
            }
        }
        return result.toString();
    }

    public String dekripsi(String ct){
        StringBuilder result = new StringBuilder();

        String preCt = ct.toUpperCase();

        for(int i = 0; i< preCt.length(); i++){
            char curr = preCt.charAt(i);

            int index = this.key.indexOf(curr);

            if(index != -1){
                result.append(FINAL_STRING.charAt(index));
            } else {
                result.append(curr);
            }
        }

        return result.toString();
    }

    public String dekripsi (String ct, String key){
        StringBuilder result = new StringBuilder();

        String preCt = ct.toUpperCase();

        for(int i = 0; i< preCt.length(); i++){
            char curr = preCt.charAt(i);

            int index = key.indexOf(curr);

            if(index != -1){
                result.append(FINAL_STRING.charAt(index));
            } else {
                result.append(curr);
            }
        }

        return result.toString();
    }

    private String generateKey(){
        List<Character> key = new ArrayList<>();
        for (char c : FINAL_STRING.toCharArray()){
            key.add(c);
        } 

        Collections.shuffle(key);

        StringBuilder finalKey = new StringBuilder();
        for (char c : key){
            finalKey.append(c);
        }

        return finalKey.toString();
    }

    public void remakeKey(){
        this.key = generateKey();
    }

    public static void main(String[] args) {
        Substitution subs = new Substitution();

        String pt = "Bang, ambilkan makanan di meja";
        String enkrip = subs.enkripsi(pt);
        String dekrip = subs.dekripsi(enkrip);

        System.out.println("Plaintext : " + pt);
        System.out.println("Ciphertext : " + enkrip);
        System.out.println("Decrypted : " + dekrip);
        System.out.println("Key : " + subs.key);
        
        subs.remakeKey();
        
        enkrip = subs.enkripsi(pt);
        dekrip = subs.dekripsi(enkrip);
        
        System.out.println();
        System.out.println("Plaintext : " + pt);
        System.out.println("Ciphertext : " + enkrip);
        System.out.println("Decrypted : " + dekrip);
        System.out.println("Key : " + subs.key);

    }

}
