# Role Constraints & Access Control

## 📋 Overview

Sistem SIMKULIAH memiliki 3 role utama dengan hak akses yang berbeda-beda:

### 1. **Admin**

- **Akses**: Full access ke semua menu dan submenu
- **Kemampuan**:
  - Akses penuh ke semua fitur
  - CRUD (Create, Read, Update, Delete) semua data
  - Mengatur user management
  - Melihat semua data mahasiswa
  - Mengisi nilai forward dan backward (per-CPL)

### 2. **Dosen**

- **Akses**: Terbatas pada menu akademik
- **Kemampuan**:
  - View semua menu kurikulum
  - **Input Nilai Forward dan Backward (per-CPL)** - Fitur utama dosen
  - View data semua mahasiswa
  - Tidak bisa delete atau modify struktur kurikulum

### 3. **Mahasiswa**

- **Akses**: Sangat terbatas, hanya view data pribadi
- **Kemampuan**:
  - **View grafik nilai akhir (per-CPL) milik dirinya sendiri**
  - View dashboard pribadi
  - Tidak bisa akses data mahasiswa lain
  - Tidak bisa akses menu kurikulum management

---

## 🗂️ Database Structure

### Tabel Data yang Tersedia:

1. **Tabel Dosen**: Menyimpan data dosen DAN admin
   - Kolom `role`: Membedakan antara 'admin' dan 'dosen'
   - Primary key: `nip`
2. **Tabel Mahasiswa**: Menyimpan data mahasiswa
   - Primary key: `nim`

---

## 🔐 Authentication

### Login Endpoints:

- `/login/dosen` - Untuk Admin dan Dosen
- `/login/mahasiswa` - Untuk Mahasiswa

**Backend Logic**: Backend akan menentukan apakah user adalah admin atau dosen berdasarkan kolom `role` di tabel dosen.

---

## 👥 Dummy Accounts (Development Mode)

### Admin:

```
Username (NIP): 444444444444444444
Password: 444444444444444444
Name: shakilaAdmin
Role: admin
```

### Dosen:

```
Username (NIP): 5555555555555555555
Password: 5555555555555555555
Name: haidarDosen
Role: dosen
```

### Mahasiswa 1:

```
Username (NIM): 24060120140005
Password: 24060120140005
Name: Galih Nanda Wibowo
Role: mahasiswa
```

### Mahasiswa 2:

```
Username (NIM): 24060120111111
Password: 24060120111111
Name: Gibran Mahasiswa
Role: mahasiswa
```

---

## 📊 Features & Access Matrix

| Feature                          | Admin | Dosen | Mahasiswa |
| -------------------------------- | ----- | ----- | --------- |
| Dashboard                        | ✅    | ✅    | ✅        |
| Kurikulum Management             | ✅    | ✅    | ❌        |
| Profil Lulusan                   | ✅    | ✅    | ❌        |
| CPL Prodi                        | ✅    | ✅    | ❌        |
| CPL SNDIKTI                      | ✅    | ✅    | ❌        |
| Korelasi CPL-PL                  | ✅    | ✅    | ❌        |
| CPMK                             | ✅    | ✅    | ❌        |
| Bahan Kajian                     | ✅    | ✅    | ❌        |
| Struktur Mata Kuliah             | ✅    | ✅    | ❌        |
| RPS                              | ✅    | ✅    | ❌        |
| **Input Nilai Forward/Backward** | ✅    | ✅    | ❌        |
| View Semua Nilai Mahasiswa       | ✅    | ✅    | ❌        |
| **View Nilai CPL Sendiri**       | ❌    | ❌    | ✅        |
| Mahasiswa Management             | ✅    | ✅    | ❌        |
| User Management                  | ✅    | ❌    | ❌        |
| Delete Data                      | ✅    | ❌    | ❌        |

---

## 🎯 Constraint Details

### 1. Dosen Constraint:

- **Primary Task**: Mengisi nilai forward dan backward per CPL untuk mahasiswa
- **Access Level**: Read & Write pada data nilai
- **Limitation**:
  - Tidak bisa delete struktur kurikulum
  - Tidak bisa manage users
  - Tidak bisa edit master data (PL, CPL, CPMK, dll)

### 2. Mahasiswa Constraint:

- **Primary View**: Melihat grafik nilai akhir CPL milik dirinya sendiri
- **Access Level**: Read-only untuk data pribadi
- **Limitation**:
  - Hanya bisa view data dengan NIM-nya sendiri
  - Tidak bisa akses menu management
  - Tidak bisa view data mahasiswa lain

### 3. Admin Constraint:

- **No Constraints**: Full access ke semua fitur

---

## 🔗 API Endpoints

### Nilai Mahasiswa per Periode per CPL:

```
GET /view/mahasiswa/:nim/:periode
```

**Contoh**:

```
GET /view/mahasiswa/24060120140005/20201
```

**Response** (Expected):

```json
{
  "success": true,
  "data": [
    {
      "kode_cpl": "CPL-01",
      "nama_cpl": "Mampu menerapkan pemikiran logis...",
      "nilai_forward": 85,
      "nilai_backward": 82,
      "nilai_akhir": 83.5,
      "status": "Lulus"
    }
    // ... more CPL data
  ]
}
```

---

## 🛡️ Implementation

### Frontend Guard:

1. **Router Guard**: Mengecek role di `router/index.js`
2. **Composable Permission**: `usePermissions()` di `composables/usePermissions.js`
3. **Component Level**: Check permission di setiap component

### Backend Validation:

- Backend harus validate role dari token JWT
- Backend harus validate ownership untuk mahasiswa (hanya bisa akses data sendiri)
- Backend menentukan admin/dosen dari kolom `role` di tabel dosen

---

## 📝 Usage Example

### Check Permission in Component:

```vue
<script setup>
import { usePermissions } from '@/composables/usePermissions'

const { can, isMahasiswa, canAccessMahasiswaData } = usePermissions()

// Check if user can edit nilai
if (can('nilaiMatkul', 'edit')) {
  // Show edit button
}

// Check if mahasiswa can access specific data
if (canAccessMahasiswaData('24060120140005')) {
  // Load data
}
</script>
```

### Conditional Rendering:

```vue
<template>
  <!-- Only show for dosen and admin -->
  <button v-if="can('nilaiMatkul', 'inputNilaiForward')">Input Nilai Forward</button>

  <!-- Only show for mahasiswa viewing their own data -->
  <div v-if="isMahasiswa && canAccessMahasiswaData(nim)">
    <GrafikNilaiCPL :nim="nim" />
  </div>
</template>
```

---

## 🚀 Route Examples

### Mahasiswa viewing their scores:

```
/mahasiswa/24060120140005/20201
```

### Dosen inputting scores:

```
/kurikulum/2020/nilai-matkul
/kurikulum/2020/ukur-cpl
```

### Admin managing everything:

```
/kurikulum/2020/*
/mahasiswa
```

---

## ⚠️ Important Notes

1. **Security**: Always validate permissions on backend, frontend checks are for UX only
2. **Token**: JWT token harus contain role information
3. **Ownership**: Mahasiswa endpoints harus validate NIM dari token matches requested NIM
4. **Error Handling**: Show appropriate error messages when permission denied
5. **Redirect**: Auto-redirect user to allowed pages when accessing forbidden routes

---

## 🔄 Future Enhancements

- [ ] Role-based sidebar menu filtering
- [ ] Granular permissions (per-feature toggle)
- [ ] Activity logging per role
- [ ] Role delegation (temporary permissions)
- [ ] Multi-role support (user with multiple roles)
