// Static data for Kurikulum 2020
export const kurikulumId = import.meta.env.VITE_DEFAULT_KURIKULUM_ID || '2020'
export const kurikulumTitle = import.meta.env.VITE_KURIKULUM_TITLE || 'Kurikulum 2020'
export const kurikulumTahun = '2020'
export const kurikulumMinSKS = import.meta.env.VITE_KURIKULUM_MIN_SKS || 144

// Static data for kurikulum that can be used across components
export const kurikulumData = {
  id: kurikulumId,
  nama: kurikulumTitle,
  tahun_berlaku: kurikulumTahun,
  min_sks: kurikulumMinSKS,
}
