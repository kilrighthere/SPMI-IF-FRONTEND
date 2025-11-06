# 🔐 Dummy Accounts - Testing Credentials

## 📋 Quick Reference Table

| Role          | Username (NIP/NIM)    | Password              | Nama               | Login Via          |
| ------------- | --------------------- | --------------------- | ------------------ | ------------------ |
| **Admin**     | `444444444444444444`  | `444444444444444444`  | shakilaAdmin       | Button "Dosen"     |
| **Dosen**     | `5555555555555555555` | `5555555555555555555` | haidarDosen        | Button "Dosen"     |
| **Mahasiswa** | `24060120140005`      | `24060120140005`      | Galih Nanda Wibowo | Button "Mahasiswa" |
| **Mahasiswa** | `24060120111111`      | `24060120111111`      | Gibran Mahasiswa   | Button "Mahasiswa" |

---

## 🧪 Testing Scenarios

### 1. Test Admin Login

```
1. Klik button "Dosen" di login page
2. NIP: 444444444444444444
3. Password: 444444444444444444
4. Expected: Login berhasil sebagai shakilaAdmin (admin)
5. Access: Full access ke semua menu
```

### 2. Test Dosen Login

```
1. Klik button "Dosen" di login page
2. NIP: 5555555555555555555
3. Password: 5555555555555555555
4. Expected: Login berhasil sebagai haidarDosen (dosen)
5. Access: View & input nilai, tidak bisa delete
```

### 3. Test Mahasiswa Login - Galih

```
1. Klik button "Mahasiswa" di login page
2. NIM: 24060120140005
3. Password: 24060120140005
4. Expected: Login berhasil sebagai Galih Nanda Wibowo
5. Access: View nilai sendiri di /mahasiswa/24060120140005/:periode
```

### 4. Test Mahasiswa Login - Gibran

```
1. Klik button "Mahasiswa" di login page
2. NIM: 24060120111111
3. Password: 24060120111111
4. Expected: Login berhasil sebagai Gibran Mahasiswa
5. Access: View nilai sendiri di /mahasiswa/24060120111111/:periode
```

---

## ⚠️ Error Testing

### Test Wrong Role Selection

```
❌ Login dengan NIP admin/dosen via button "Mahasiswa"
   Expected Error: "Admin dan Dosen harus login melalui pilihan 'Dosen'"

❌ Login dengan NIM mahasiswa via button "Dosen"
   Expected Error: "Mahasiswa harus login melalui pilihan 'Mahasiswa'"
```

### Test Wrong Credentials

```
❌ Username: 999999999999999999
   Password: 444444444444444444
   Expected Error: "NIP/NIM atau password salah"

❌ Username: 444444444444444444
   Password: wrongpassword
   Expected Error: "NIP/NIM atau password salah"
```

---

## 🔗 Quick Links After Login

### Admin (shakilaAdmin):

- Dashboard: `/dashboard`
- Manage Kurikulum: `/kurikulum`
- View Mahasiswa: `/kurikulum/:id/mahasiswa`
- Input Nilai: `/kurikulum/:id/nilai-matkul`
- View Semua Data: Full access

### Dosen (haidarDosen):

- Dashboard: `/dashboard`
- View Kurikulum: `/kurikulum`
- Input Nilai Forward/Backward: `/kurikulum/:id/nilai-matkul`
- View Data Mahasiswa: `/kurikulum/:id/mahasiswa`

### Mahasiswa (Galih/Gibran):

- Dashboard: `/dashboard`
- View Nilai Sendiri: `/mahasiswa/[nim-sendiri]/[periode]`
- Contoh: `/mahasiswa/24060120140005/20201`

---

## 📝 Notes

1. **Username & Password sama** untuk kemudahan testing
2. **NIP Dosen** = 19 digit (5555555555555555555)
3. **NIP Admin** = 18 digit (444444444444444444)
4. **NIM Mahasiswa** = 14 digit (24060120XXXXXX)
5. **Case Sensitive**: Username tidak case sensitive (semua angka)
6. **Role Detection**: Automatic dari backend berdasarkan endpoint yang dipilih

---

## 🎯 Access Level Summary

| Feature                      | Admin | Dosen | Mahasiswa |
| ---------------------------- | ----- | ----- | --------- |
| Full Access                  | ✅    | ❌    | ❌        |
| View Kurikulum               | ✅    | ✅    | ❌        |
| Input Nilai Forward/Backward | ✅    | ✅    | ❌        |
| Delete Data                  | ✅    | ❌    | ❌        |
| View Semua Mahasiswa         | ✅    | ✅    | ❌        |
| View Nilai Sendiri           | ✅    | ✅    | ✅        |

---

## 🔄 Copy-Paste Ready Credentials

### Admin

```
444444444444444444
444444444444444444
```

### Dosen

```
5555555555555555555
5555555555555555555
```

### Mahasiswa 1

```
24060120140005
24060120140005
```

### Mahasiswa 2

```
24060120111111
24060120111111
```
