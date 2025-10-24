<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { computed } from 'vue'
import { kurikulumId, kurikulumData } from '@/stores/kurikulum'
import { useSidebarStore } from '@/stores/sidebar'

const router = useRouter()
const sidebarStore = useSidebarStore()

// No loading needed for static data
const isLoading = ref(false)

// Use the static data as an array for v-for rendering
const kurikulumDataArray = ref([kurikulumData])

// Handler tombol
const handleDetail = () => {
  router.push(`/kurikulum/${kurikulumId}/profil-lulusan`)
}
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <Header />
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="kur-content">
        <div class="page-header">
          <div class="page-title">
            <h2>Data Kurikulum Program Studi</h2>
            <p class="breadcrumb">
              <RouterLink to="/Dashboard">Dashboard</RouterLink>
              <span class="separator">/</span>
              <span class="current">Data Kurikulum Program Studi</span>
            </p>
          </div>
          <div class="page-actions">
            <button type="button" class="btn-secondary">
              <i class="ri-file-excel-2-line"></i>
              <span>Export Excel</span>
            </button>
            <button type="button" class="btn-secondary">
              <i class="ri-printer-line"></i>
              <span>Print</span>
            </button>
          </div>
        </div>

        <div class="table-container">
          <div class="table-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th class="col-no">
                    <div class="th-content">No.</div>
                  </th>
                  <th class="col-nama">
                    <div class="th-content">Nama Kurikulum</div>
                  </th>
                  <th class="col-tahun">
                    <div class="th-content">Tahun Berlaku</div>
                  </th>
                  <th class="col-sks">
                    <div class="th-content">Jumlah SKS Minimal</div>
                  </th>
                  <th class="col-action">
                    <div class="th-content">Action</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(kurikulum, index) in kurikulumDataArray"
                  :key="kurikulum.id"
                  class="table-row"
                >
                  <td class="col-no">
                    <div class="td-content">
                      <span class="number-badge">{{ index + 1 }}</span>
                    </div>
                  </td>
                  <td class="col-nama">
                    <div class="td-content">
                      <div class="nama-wrapper">
                        <i class="ri-book-line nama-icon"></i>
                        <span class="nama-text">{{ kurikulum.nama }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="col-tahun">
                    <div class="td-content">
                      <span class="year-badge">{{ kurikulum.tahun_berlaku }}</span>
                    </div>
                  </td>
                  <td class="col-sks">
                    <div class="td-content">
                      <div class="sks-wrapper">
                        <i class="ri-award-line sks-icon"></i>
                        <span class="sks-text">{{ kurikulum.min_sks }} SKS</span>
                      </div>
                    </div>
                  </td>
                  <td class="col-action">
                    <div class="td-content">
                      <button class="btn-detail" @click="handleDetail()">
                        <i class="ri-eye-line"></i>
                        <span>View Details</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<style scoped>
.dash-container {
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  margin-left: 306px;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  padding: 0px 20px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.minimized-sidebar {
  margin-left: 126px;
}

.kur-content {
  flex: 1;
  margin-top: 92px;
  padding: 32px;
  border-radius: 20px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title {
  flex: 1;
}

.page-title h2 {
  font-weight: 700;
  font-size: 28px;
  margin-bottom: 8px;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.5px;
}

.breadcrumb {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb a {
  color: var(--color-button);
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 600;
}

.breadcrumb a:hover {
  color: var(--color-button-hover);
}

.breadcrumb .separator {
  color: #d1d5db;
  font-weight: 400;
}

.breadcrumb .current {
  color: #9ca3af;
  font-weight: 500;
}

/* Page Actions */
.page-actions {
  display: flex;
  gap: 10px;
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

/* Modern Table */
.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Montserrat', sans-serif;
}

/* Table Header */
.modern-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(218, 42, 45, 0.15);
}

.modern-table thead tr {
  border-bottom: none;
}

.modern-table th {
  padding: 0;
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-bottom: none;
}

.th-content {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Column Widths */
.col-no {
  width: 80px;
}

.col-nama {
  width: auto;
  min-width: 200px;
}

.col-tahun {
  width: 200px;
}

.col-sks {
  width: 220px;
}

.col-action {
  width: 200px;
}

/* Table Body */
.modern-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.25s ease;
  background: white;
}

.modern-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
  box-shadow: 0 2px 8px rgba(218, 42, 45, 0.08);
}

.modern-table tbody tr:last-child {
  border-bottom: none;
}

.modern-table td {
  padding: 0;
  color: #4b5563;
  font-size: 14px;
}

.td-content {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Number Badge */
.number-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: var(--color-text);
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s ease;
}


/* Nama Wrapper */
.nama-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  width: 100%;
}

.nama-icon {
  font-size: 22px;
  color: var(--color-button);
  flex-shrink: 0;
  opacity: 0.8;
  /* transition: all 0.2s ease; */
}

/* .modern-table tbody tr:hover .nama-icon {
  opacity: 1;
  transform: scale(1.1);
} */

.nama-text {
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
  letter-spacing: -0.2px;
}

/* Year Badge */
.year-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  /* background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); */
  color: var(--color-text);
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  /* border: 1px solid #93c5fd; */
  /* transition: all 0.2s ease; */
}

/* .modern-table tbody tr:hover .year-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #2563eb;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
} */

/* SKS Wrapper */
.sks-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.sks-icon {
  font-size: 20px;
  color: #f59e0b;
  /* transition: all 0.2s ease; */
}

/* .modern-table tbody tr:hover .sks-icon {
  transform: scale(1.15);
  color: #d97706;
} */

.sks-text {
  font-weight: 700;
  font-size: 15px;
  color: var(--color-text);
  /* transition: all 0.2s ease; */
}

/* .modern-table tbody tr:hover .sks-text {
  color: #f59e0b;
} */

/* Action Button */
.btn-detail {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  color: var(--color-button);
  border: 1.5px solid var(--color-button);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
}

.btn-detail:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--color-button);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--color-button) 0.35;
}

.btn-detail:active {
  transform: translateY(0);
}

.btn-detail i {
  font-size: 18px;
}

/* Secondary Buttons */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: white;
  color: var(--color-text);
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
}

.btn-secondary:hover {
  background: var(--color-button);
  color: white;
  border-color: var(--color-buttonsec);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary:active {
  transform: translateY(0);
}

.btn-secondary i {
  font-size: 18px;
}

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 282px;
  }

  .main-content.minimized-sidebar {
    margin-left: 114px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .page-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 256px;
    padding: 0 16px;
  }

  .main-content.minimized-sidebar {
    margin-left: 100px;
  }

  .kur-content {
    margin-top: 76px;
    padding: 20px;
  }

  .page-title h2 {
    font-size: 22px;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .modern-table {
    min-width: 700px;
  }

  .btn-detail span,
  .btn-secondary span {
    display: none;
  }

  .btn-detail,
  .btn-secondary {
    padding: 10px;
  }
}
</style>
