--
-- PostgreSQL database dump
--

\restrict 3hGjHAi7vYGdyFJLFhT2CPVuroyhVw1gcQ171uCmR58DooAnjHpgCqZdWYSFanr

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: benefita; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA benefita;


ALTER SCHEMA benefita OWNER TO postgres;

--
-- Name: JenisIzin; Type: TYPE; Schema: benefita; Owner: postgres
--

CREATE TYPE benefita."JenisIzin" AS ENUM (
    'CUTI',
    'SAKIT',
    'IZIN'
);


ALTER TYPE benefita."JenisIzin" OWNER TO postgres;

--
-- Name: RoleStatus; Type: TYPE; Schema: benefita; Owner: postgres
--

CREATE TYPE benefita."RoleStatus" AS ENUM (
    'SUPER_ADMIN',
    'FINANCE',
    'DAILY_ADMIN',
    'MARKETING_STAFF',
    'MARKETING_SEMENTARA',
    'TEKNIS',
    'ADMIN'
);


ALTER TYPE benefita."RoleStatus" OWNER TO postgres;

--
-- Name: StatusIzin; Type: TYPE; Schema: benefita; Owner: postgres
--

CREATE TYPE benefita."StatusIzin" AS ENUM (
    'PENDING',
    'DISETUJUI',
    'DITOLAK'
);


ALTER TYPE benefita."StatusIzin" OWNER TO postgres;

--
-- Name: TipeSurat; Type: TYPE; Schema: benefita; Owner: postgres
--

CREATE TYPE benefita."TipeSurat" AS ENUM (
    'umum',
    'marketing',
    'lsp'
);


ALTER TYPE benefita."TipeSurat" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: BuktiIzin; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."BuktiIzin" (
    id text NOT NULL,
    "pengajuanIzinId" text NOT NULL,
    nama text NOT NULL,
    url text NOT NULL,
    key text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE benefita."BuktiIzin" OWNER TO postgres;

--
-- Name: DeviceTrusted; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."DeviceTrusted" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "deviceHash" text NOT NULL,
    label text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE benefita."DeviceTrusted" OWNER TO postgres;

--
-- Name: DokumenPegawai; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."DokumenPegawai" (
    id text NOT NULL,
    "pegawaiId" text NOT NULL,
    nama text NOT NULL,
    url text NOT NULL,
    key text NOT NULL,
    tipe text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE benefita."DokumenPegawai" OWNER TO postgres;

--
-- Name: HakAksesKaryawan; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."HakAksesKaryawan" (
    id text NOT NULL,
    "perusahaanId" text NOT NULL,
    "pegawaiId" text,
    "jenisAkses" text NOT NULL,
    status text,
    "tanggalDibuat" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE benefita."HakAksesKaryawan" OWNER TO postgres;

--
-- Name: OtpCode; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."OtpCode" (
    id text NOT NULL,
    "userId" text NOT NULL,
    code text NOT NULL,
    "deviceHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE benefita."OtpCode" OWNER TO postgres;

--
-- Name: Pegawai; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."Pegawai" (
    id text NOT NULL,
    nama text NOT NULL,
    jabatan text,
    kode text,
    prefix text,
    departemen text,
    "fotoKey" text,
    "fotoUrl" text,
    nip text
);


ALTER TABLE benefita."Pegawai" OWNER TO postgres;

--
-- Name: PengajuanIzin; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."PengajuanIzin" (
    id text NOT NULL,
    "pegawaiId" text NOT NULL,
    "jenisIzin" benefita."JenisIzin" NOT NULL,
    "tanggalMulai" timestamp(3) without time zone NOT NULL,
    "tanggalSelesai" timestamp(3) without time zone NOT NULL,
    alasan text NOT NULL,
    "alasanTolak" text,
    status benefita."StatusIzin" DEFAULT 'PENDING'::benefita."StatusIzin" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tanggalKonfirmasi" timestamp(3) without time zone
);


ALTER TABLE benefita."PengajuanIzin" OWNER TO postgres;

--
-- Name: Proper; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."Proper" (
    id integer NOT NULL,
    "perusahaanId" character varying(50) NOT NULL,
    tahun integer NOT NULL,
    emas integer DEFAULT 0 NOT NULL,
    hijau integer DEFAULT 0 NOT NULL,
    biru integer DEFAULT 0 NOT NULL,
    merah integer DEFAULT 0 NOT NULL,
    hitam integer DEFAULT 0 NOT NULL
);


ALTER TABLE benefita."Proper" OWNER TO postgres;

--
-- Name: Proper_id_seq; Type: SEQUENCE; Schema: benefita; Owner: postgres
--

CREATE SEQUENCE benefita."Proper_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE benefita."Proper_id_seq" OWNER TO postgres;

--
-- Name: Proper_id_seq; Type: SEQUENCE OWNED BY; Schema: benefita; Owner: postgres
--

ALTER SEQUENCE benefita."Proper_id_seq" OWNED BY benefita."Proper".id;


--
-- Name: RefreshToken; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."RefreshToken" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "deviceHash" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE benefita."RefreshToken" OWNER TO postgres;

--
-- Name: SertifikasiBnsp; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."SertifikasiBnsp" (
    id integer NOT NULL,
    "perusahaanId" character varying(50) NOT NULL,
    pppa character varying(255),
    popal character varying(255),
    pppu character varying(255),
    poippu character varying(255),
    "limbahB3" character varying(255),
    "tpsLb3" character varying(255),
    "sampah3R" character varying(255),
    "pSampah" character varying(255),
    "aEnergi" character varying(255),
    "mEnergi" character varying(255),
    pcua character varying(255),
    lca character varying(255)
);


ALTER TABLE benefita."SertifikasiBnsp" OWNER TO postgres;

--
-- Name: SertifikasiBnsp_id_seq; Type: SEQUENCE; Schema: benefita; Owner: postgres
--

CREATE SEQUENCE benefita."SertifikasiBnsp_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE benefita."SertifikasiBnsp_id_seq" OWNER TO postgres;

--
-- Name: SertifikasiBnsp_id_seq; Type: SEQUENCE OWNED BY; Schema: benefita; Owner: postgres
--

ALTER SEQUENCE benefita."SertifikasiBnsp_id_seq" OWNED BY benefita."SertifikasiBnsp".id;


--
-- Name: TabPerusahaan; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."TabPerusahaan" (
    "0NO_INDUK" character varying(50) NOT NULL,
    "jenisInstansi" character varying(50) DEFAULT 'PERUSAHAAN'::character varying NOT NULL,
    "1COMPANY" character varying(255),
    "2ALAMAT" character varying(255),
    "5TELP" character varying(255),
    "6FAX" character varying(255),
    "7EMAIL" character varying(255),
    "24KET" text,
    fasilitas character varying(255),
    "ButuhTraining" character varying(255),
    "prioritasMa" character varying(50),
    "prioritasAe" character varying(50),
    "21GROUP" character varying(255),
    "idSimpel" character varying(100),
    "alamatWaktu" character varying(4),
    "alamatFactory" character varying(255),
    "alamatFactoryWaktu" character varying(4),
    iso9000 character varying(255),
    iso14000 character varying(255),
    ohsas18001smk3 character varying(255),
    "kategoriCpn" character varying(255),
    "lineOfBusiness" character varying(255),
    "lineBisnisSub" character varying(255),
    permodalan character varying(255),
    "nilaiSubBidangProper" integer,
    "batasEmas" integer,
    "batasHijau" integer,
    "infoKeu" character varying(255),
    "bdoAction" character varying(50),
    vendor character varying(15),
    "cabangSite" character varying(255),
    pesaing character varying(255),
    "prosedurPelatihan" character varying(255),
    "kotaKabupaten" character varying(100),
    provinsi character varying(100),
    instansi character varying(255),
    "sekilasLh" text,
    rsud integer DEFAULT 0,
    "indPengolahan" integer DEFAULT 0,
    pertambangan integer DEFAULT 0,
    "listrikGasAirBersih" integer DEFAULT 0,
    "hotelResto" integer DEFAULT 0,
    "angkutTrans" integer DEFAULT 0,
    bangunan integer DEFAULT 0,
    pertanian integer DEFAULT 0,
    keuangan integer DEFAULT 0,
    laut integer DEFAULT 0,
    jasa integer DEFAULT 0,
    kode character varying(100),
    tender1 character varying(255),
    tender2 character varying(255),
    tender3 character varying(255),
    "pelatihanDiikuti" text,
    pemilik character varying(255),
    yayasan character varying(255),
    "subKategori" character varying(255),
    "cpSekolah" character varying(255),
    "dateInput" timestamp(3) without time zone,
    "dateUpdate" timestamp(3) without time zone,
    inputter text,
    updatter text,
    akreditasi character varying(50)
);


ALTER TABLE benefita."TabPerusahaan" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita."User" (
    id text NOT NULL,
    "pegawaiId" text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role benefita."RoleStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastIpAddress" text,
    "lastOnlineAt" timestamp(3) without time zone
);


ALTER TABLE benefita."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE benefita._prisma_migrations OWNER TO postgres;

--
-- Name: berita; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.berita (
    id text NOT NULL,
    periode timestamp(3) without time zone NOT NULL,
    isi text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE benefita.berita OWNER TO postgres;

--
-- Name: contact_person_perusahaan; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.contact_person_perusahaan (
    "KODE" character varying(50) NOT NULL,
    "KODE_PERUSAHAAN" character varying(50) NOT NULL,
    "NAMA" character varying(255) NOT NULL,
    "TEKNIS_TERTINGGI" boolean DEFAULT false NOT NULL,
    "JABATAN" character varying(255),
    "HP" character varying(50),
    "EMAIL" character varying(255),
    "POSISI" character varying(50),
    "KEUANGAN" character varying(50),
    "MINTA" character varying(255),
    "KET" text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE benefita.contact_person_perusahaan OWNER TO postgres;

--
-- Name: daily_activity; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.daily_activity (
    "ID" text NOT NULL,
    "PEGAWAI_ID" character varying(50) NOT NULL,
    "PERUSAHAAN_ID" character varying(50) NOT NULL,
    "KONTAK" character varying(255) NOT NULL,
    "JENIS_TRAINING" character varying(255) NOT NULL,
    "KETERANGAN" character varying(255) NOT NULL,
    "KATEGORI" character varying(255) NOT NULL,
    "INOUT" character varying(50) NOT NULL,
    "TANGGAL" character varying(50) NOT NULL,
    "PERUSAHAAN" character varying(255) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    "DATE_TARGET" date
);


ALTER TABLE benefita.daily_activity OWNER TO postgres;

--
-- Name: hotel; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.hotel (
    id text NOT NULL,
    kode_hotel text NOT NULL,
    nama_hotel text NOT NULL,
    alamat text NOT NULL,
    kota text NOT NULL,
    telepon text NOT NULL,
    fax text,
    pub_rate integer,
    cor_rate integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE benefita.hotel OWNER TO postgres;

--
-- Name: jadwal_training; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.jadwal_training (
    id integer NOT NULL,
    "noJadwal" text NOT NULL,
    "kodePelatihan" text NOT NULL,
    "tglMulai" timestamp(3) without time zone,
    "tglSelesai" timestamp(3) without time zone,
    "judulLengkap" text NOT NULL,
    "judulPendek" text NOT NULL,
    metode text NOT NULL,
    "jenisTraining" text NOT NULL,
    kota text NOT NULL,
    "lokasiDetail" text,
    biaya integer NOT NULL,
    catatan text,
    "fileAgenda" text,
    "lastUpdate" timestamp(3) without time zone NOT NULL,
    "updateOleh" text NOT NULL,
    status text NOT NULL
);


ALTER TABLE benefita.jadwal_training OWNER TO postgres;

--
-- Name: jadwal_training_id_seq; Type: SEQUENCE; Schema: benefita; Owner: postgres
--

CREATE SEQUENCE benefita.jadwal_training_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE benefita.jadwal_training_id_seq OWNER TO postgres;

--
-- Name: jadwal_training_id_seq; Type: SEQUENCE OWNED BY; Schema: benefita; Owner: postgres
--

ALTER SEQUENCE benefita.jadwal_training_id_seq OWNED BY benefita.jadwal_training.id;


--
-- Name: judul_training; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.judul_training (
    id integer NOT NULL,
    kode text NOT NULL,
    "judulTraining" text NOT NULL,
    tipe text NOT NULL,
    hari integer NOT NULL,
    "biayaOffline" integer NOT NULL,
    "biayaOnline" integer NOT NULL,
    batch integer NOT NULL,
    brosur text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE benefita.judul_training OWNER TO postgres;

--
-- Name: judul_training_id_seq; Type: SEQUENCE; Schema: benefita; Owner: postgres
--

CREATE SEQUENCE benefita.judul_training_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE benefita.judul_training_id_seq OWNER TO postgres;

--
-- Name: judul_training_id_seq; Type: SEQUENCE OWNED BY; Schema: benefita; Owner: postgres
--

ALTER SEQUENCE benefita.judul_training_id_seq OWNED BY benefita.judul_training.id;


--
-- Name: kontak; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.kontak (
    id integer NOT NULL,
    kode text NOT NULL,
    nama text NOT NULL,
    referensi text,
    alamat text,
    "subjekKhusus" text,
    telp text,
    keterangan text,
    email text,
    tugas timestamp(3) without time zone,
    kantor text,
    "alamatKantor" text,
    "noTelpKantor" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE benefita.kontak OWNER TO postgres;

--
-- Name: kontak_id_seq; Type: SEQUENCE; Schema: benefita; Owner: postgres
--

CREATE SEQUENCE benefita.kontak_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE benefita.kontak_id_seq OWNER TO postgres;

--
-- Name: kontak_id_seq; Type: SEQUENCE OWNED BY; Schema: benefita; Owner: postgres
--

ALTER SEQUENCE benefita.kontak_id_seq OWNED BY benefita.kontak.id;


--
-- Name: log_perubahan_perusahaan; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.log_perubahan_perusahaan (
    id text NOT NULL,
    perusahaan_id text NOT NULL,
    field text NOT NULL,
    data_lama jsonb,
    data_baru jsonb,
    diubah_oleh text NOT NULL,
    tanggal timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE benefita.log_perubahan_perusahaan OWNER TO postgres;

--
-- Name: penawaran; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.penawaran (
    id text NOT NULL,
    "kodePelatihan" text[],
    tanggal timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "filePath" character varying(500),
    "perusahaanId" text NOT NULL
);


ALTER TABLE benefita.penawaran OWNER TO postgres;

--
-- Name: pengajuan_judul_training; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.pengajuan_judul_training (
    id text NOT NULL,
    "judulTraining" text NOT NULL,
    "jumlahHari" integer NOT NULL,
    "namaKontak" text,
    kontak text,
    "jumlahPeserta" integer,
    "perusahaanId" text NOT NULL,
    "inputOlehId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tanggalPengajuan" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "responMA" text DEFAULT 'PENDING'::text
);


ALTER TABLE benefita.pengajuan_judul_training OWNER TO postgres;

--
-- Name: permintaan_nomor_surat; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.permintaan_nomor_surat (
    id integer NOT NULL,
    "noSurat" character varying(100) NOT NULL,
    keterangan text,
    tanggal_kirim timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tipe benefita."TipeSurat" DEFAULT 'umum'::benefita."TipeSurat" NOT NULL,
    tujuan_no_induk character varying(50) NOT NULL,
    pengirim_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE benefita.permintaan_nomor_surat OWNER TO postgres;

--
-- Name: permintaan_nomor_surat_id_seq; Type: SEQUENCE; Schema: benefita; Owner: postgres
--

CREATE SEQUENCE benefita.permintaan_nomor_surat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE benefita.permintaan_nomor_surat_id_seq OWNER TO postgres;

--
-- Name: permintaan_nomor_surat_id_seq; Type: SEQUENCE OWNED BY; Schema: benefita; Owner: postgres
--

ALTER SEQUENCE benefita.permintaan_nomor_surat_id_seq OWNED BY benefita.permintaan_nomor_surat.id;


--
-- Name: permohonan_hak_akses; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.permohonan_hak_akses (
    id text NOT NULL,
    perusahaan_id text NOT NULL,
    pegawai_id text NOT NULL,
    jenis_akses character varying(10) NOT NULL,
    terima boolean,
    tanggal timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE benefita.permohonan_hak_akses OWNER TO postgres;

--
-- Name: peserta_training; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.peserta_training (
    id integer NOT NULL,
    nama text NOT NULL,
    jabatan text,
    alamat text,
    "noTelp" text,
    "noFax" text,
    email text,
    "alamatPengirimanSertifikat" text,
    catatan text,
    industri text,
    status text,
    "noIndukPerusahaan" text NOT NULL,
    "noJadwal" text NOT NULL,
    ujian text,
    "noInvUjian" text,
    "noKwtUjian" text,
    diskon integer,
    ppn integer,
    cashback integer,
    "hargaTotal" integer,
    bayar integer,
    "infoPembayaran" text,
    "infoPenagihan" text,
    "tglBayar" timestamp(3) without time zone,
    "noInvoice" text,
    "noKwitansi" text,
    "updateOleh" text,
    "konfirmasiOleh" text,
    "tglInput" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tglUpdate" timestamp(3) without time zone NOT NULL,
    "accExecutive" text,
    "inputOleh" text NOT NULL,
    "ownEnv" text,
    metode text,
    "fileBuktiPembayaran" text,
    "filePendaftaran" text
);


ALTER TABLE benefita.peserta_training OWNER TO postgres;

--
-- Name: peserta_training_id_seq; Type: SEQUENCE; Schema: benefita; Owner: postgres
--

CREATE SEQUENCE benefita.peserta_training_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE benefita.peserta_training_id_seq OWNER TO postgres;

--
-- Name: peserta_training_id_seq; Type: SEQUENCE OWNED BY; Schema: benefita; Owner: postgres
--

ALTER SEQUENCE benefita.peserta_training_id_seq OWNED BY benefita.peserta_training.id;


--
-- Name: tabposperusahaan; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.tabposperusahaan (
    id text NOT NULL,
    nama character varying(255) NOT NULL,
    jabatan character varying(255) NOT NULL,
    "FOLLOW_UP" character varying(255),
    "NO_INDUK" character varying(50) NOT NULL,
    "ACC" character varying(255) NOT NULL
);


ALTER TABLE benefita.tabposperusahaan OWNER TO postgres;

--
-- Name: trainer_on_jadwal; Type: TABLE; Schema: benefita; Owner: postgres
--

CREATE TABLE benefita.trainer_on_jadwal (
    "jadwalId" integer NOT NULL,
    "trainerKode" text NOT NULL
);


ALTER TABLE benefita.trainer_on_jadwal OWNER TO postgres;

--
-- Name: Proper id; Type: DEFAULT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."Proper" ALTER COLUMN id SET DEFAULT nextval('benefita."Proper_id_seq"'::regclass);


--
-- Name: SertifikasiBnsp id; Type: DEFAULT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."SertifikasiBnsp" ALTER COLUMN id SET DEFAULT nextval('benefita."SertifikasiBnsp_id_seq"'::regclass);


--
-- Name: jadwal_training id; Type: DEFAULT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.jadwal_training ALTER COLUMN id SET DEFAULT nextval('benefita.jadwal_training_id_seq'::regclass);


--
-- Name: judul_training id; Type: DEFAULT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.judul_training ALTER COLUMN id SET DEFAULT nextval('benefita.judul_training_id_seq'::regclass);


--
-- Name: kontak id; Type: DEFAULT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.kontak ALTER COLUMN id SET DEFAULT nextval('benefita.kontak_id_seq'::regclass);


--
-- Name: permintaan_nomor_surat id; Type: DEFAULT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.permintaan_nomor_surat ALTER COLUMN id SET DEFAULT nextval('benefita.permintaan_nomor_surat_id_seq'::regclass);


--
-- Name: peserta_training id; Type: DEFAULT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.peserta_training ALTER COLUMN id SET DEFAULT nextval('benefita.peserta_training_id_seq'::regclass);


--
-- Data for Name: BuktiIzin; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."BuktiIzin" (id, "pengajuanIzinId", nama, url, key, "createdAt") FROM stdin;
\.


--
-- Data for Name: DeviceTrusted; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."DeviceTrusted" (id, "userId", "deviceHash", label, "createdAt") FROM stdin;
cmq671onx0005jc1cc9fv1qn1	cmq66v8eq0006jc78qx4lbqcr	558a6b7	Chrome Browser	2026-06-09 05:23:03.837
cmq68mtef0003jc3w8qx18ggn	cmq67a4yn001qjc1cl7gitkyz	558a6b7	Chrome Browser	2026-06-09 06:07:29.367
\.


--
-- Data for Name: DokumenPegawai; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."DokumenPegawai" (id, "pegawaiId", nama, url, key, tipe, "createdAt") FROM stdin;
cmq67a4yn001pjc1coceqftc6	cmq67a4yn001ojc1chcom9uxp	PORTOFOLIO.pdf	/uploads/pegawai/1780982978017-880395706.pdf	1780982978017-880395706.pdf	\N	2026-06-09 05:29:38.207
\.


--
-- Data for Name: HakAksesKaryawan; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."HakAksesKaryawan" (id, "perusahaanId", "pegawaiId", "jenisAkses", status, "tanggalDibuat") FROM stdin;
\.


--
-- Data for Name: OtpCode; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."OtpCode" (id, "userId", code, "deviceHash", "expiresAt", used, "createdAt") FROM stdin;
cmq671f920003jc1cqflfwemm	cmq66v8eq0006jc78qx4lbqcr	295348	558a6b7	2026-06-09 05:27:51.637	t	2026-06-09 05:22:51.639
cmq68mdpn0001jc3w45gmkxbb	cmq67a4yn001qjc1cl7gitkyz	854589	558a6b7	2026-06-09 06:12:09.034	t	2026-06-09 06:07:09.035
\.


--
-- Data for Name: Pegawai; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."Pegawai" (id, nama, jabatan, kode, prefix, departemen, "fotoKey", "fotoUrl", nip) FROM stdin;
cmq66v8cx0001jc78fzjhjab8	Siti Rahayu	Staff Keuangan	\N	\N	Finance	\N	\N	NIP002
cmq66v8d10002jc78j8ujs5tg	Ahmad Fauzi	Admin Harian	\N	\N	Admin	\N	\N	NIP003
cmq66v8d30003jc78r7p2h35d	Dewi Lestari	Staff Marketing	\N	\N	Marketing	\N	\N	NIP004
cmq66v8d50004jc78hue5rieb	Rizky Pratama	Super Admin	\N	\N	IT	\N	\N	NIP005
cmq66v8cq0000jc78h1xi5ccz	Budi Santoso	Manager Marketing	\N	\N	Marketing	\N	\N	NIP001
cmq67a4yn001ojc1chcom9uxp	Axel Putra	Freelance	AXL	AXL	Programming	1780982978015-969701130.jpeg	/uploads/pegawai/1780982978015-969701130.jpeg	2491324235
cmq67bagu001rjc1chivx3ch4	Wulan	\N	\N	\N	\N	\N	\N	\N
cmq67eg2w0023jc1cq2v2qets	Sylva	\N	\N	\N	\N	\N	\N	\N
cmq67feia0027jc1chy4j53k6	Zirah	\N	\N	\N	\N	\N	\N	\N
cmq67jqy60002jcs8cejwgbhd	Ghifari	\N	\N	\N	\N	\N	\N	\N
cmq67m7fm0000jc4wafuhw4j6	Nanang	\N	\N	\N	\N	\N	\N	\N
cmq67n6n30002jc4waspqbbcz	Mulyadi Afmar	\N	\N	\N	\N	\N	\N	\N
cmq67oa800004jc4wzfnrwspn	Muhammad Habibie Musy	\N	\N	\N	\N	\N	\N	\N
cmq67p4o30006jc4w3vp1um2l	Syukraini Suswita	\N	\N	\N	\N	\N	\N	\N
cmq67px7v0008jc4wr1hcindk	Arief	\N	\N	\N	\N	\N	\N	\N
cmq67qist000cjc4wq0nz96c3	Eni	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: PengajuanIzin; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."PengajuanIzin" (id, "pegawaiId", "jenisIzin", "tanggalMulai", "tanggalSelesai", alasan, "alasanTolak", status, "createdAt", "updatedAt", "tanggalKonfirmasi") FROM stdin;
\.


--
-- Data for Name: Proper; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."Proper" (id, "perusahaanId", tahun, emas, hijau, biru, merah, hitam) FROM stdin;
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."RefreshToken" (id, token, "userId", "deviceHash", "expiresAt", "createdAt") FROM stdin;
cmq68djqt0003jcecr5qe8ujn	a736bfbedc0de2d6161aeed36b3b44c17f48fbf9a395de08233d743c45454f6cf37e2071c2e6cac1b5829eb3a6143c594aab78550e8ea93ededc0909a2066f3e	cmq66v8eq0006jc78qx4lbqcr	558a6b7	2026-06-16 06:00:16.948	2026-06-09 06:00:16.949
cmq6a2lof000pjcnopa20razd	98ab1c3aed4fee54e84652ec9051c0628a70dfa809fa690b3604b77865d90ee58309b1671dbb199c534f4d955a10a7a27fed4bf7c48840445d20664f61919e30	cmq67a4yn001qjc1cl7gitkyz	558a6b7	2026-06-16 06:47:45.47	2026-06-09 06:47:45.472
\.


--
-- Data for Name: SertifikasiBnsp; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."SertifikasiBnsp" (id, "perusahaanId", pppa, popal, pppu, poippu, "limbahB3", "tpsLb3", "sampah3R", "pSampah", "aEnergi", "mEnergi", pcua, lca) FROM stdin;
\.


--
-- Data for Name: TabPerusahaan; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."TabPerusahaan" ("0NO_INDUK", "jenisInstansi", "1COMPANY", "2ALAMAT", "5TELP", "6FAX", "7EMAIL", "24KET", fasilitas, "ButuhTraining", "prioritasMa", "prioritasAe", "21GROUP", "idSimpel", "alamatWaktu", "alamatFactory", "alamatFactoryWaktu", iso9000, iso14000, ohsas18001smk3, "kategoriCpn", "lineOfBusiness", "lineBisnisSub", permodalan, "nilaiSubBidangProper", "batasEmas", "batasHijau", "infoKeu", "bdoAction", vendor, "cabangSite", pesaing, "prosedurPelatihan", "kotaKabupaten", provinsi, instansi, "sekilasLh", rsud, "indPengolahan", pertambangan, "listrikGasAirBersih", "hotelResto", "angkutTrans", bangunan, pertanian, keuangan, laut, jasa, kode, tender1, tender2, tender3, "pelatihanDiikuti", pemilik, yayasan, "subKategori", "cpSekolah", "dateInput", "dateUpdate", inputter, updatter, akreditasi) FROM stdin;
PRU001	PERUSAHAAN	PT Maju Bersama	Jl. Sudirman No.1, Jakarta	02111111	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Manufaktur	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
PRU002	PERUSAHAAN	PT Karya Indah	Jl. Gatot Subroto No.5, Bekasi	02122222	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Tekstil	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
PRU003	PERUSAHAAN	PT Energi Nusantara	Jl. HR Rasuna Said, Jakarta	02133333	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Energi	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
PRU004	PERUSAHAAN	PT Sejahtera Abadi	Jl. Raya Bogor No.10, Depok	02144444	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Logistik	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
RS001	RUMAH_SAKIT	RS Harapan Sehat	Jl. Kesehatan No.3, Bandung	02255555	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
RS002	RUMAH_SAKIT	RS Bunda Kasih	Jl. Dr. Soetomo No.8, Surabaya	03166666	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
PMD001	PEMDA	Pemda Kab. Bogor	Jl. Tegar Beriman, Bogor	02577777	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Bogor	Jawa Barat	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
PMD002	PEMDA	Pemda Kota Semarang	Jl. Pemuda No.1, Semarang	02488888	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Semarang	Jawa Tengah	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
PMD003	PEMDA	Pemda Kab. Tangerang	Jl. Tigaraksa, Tangerang	02199999	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Tangerang	Banten	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
INS001	INSTANSI_DAERAH	Dinas LH Kota Depok	Jl. Margonda Raya, Depok	02100001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Dinas Lingkungan Hidup	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
INS002	INSTANSI_DAERAH	BPLHD Provinsi Jabar	Jl. Naripan No.25, Bandung	02200002	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	BPLHD	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
SKL001	SEKOLAH	SMK Teknologi Maju	Jl. Pendidikan No.5, Bekasi	02100003	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	Yayasan Maju	YPT Maju	\N	\N	\N	\N	\N	\N	\N
SKL002	SEKOLAH	SMA Negeri 1 Bogor	Jl. Pajajaran No.12, Bogor	02500004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	Negeri	\N	SMA	\N	\N	\N	\N	\N	\N
SKL003	SEKOLAH	Universitas Nusantara	Jl. Raya Kampus No.1, Depok	02100005	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	Swasta	\N	Perguruan Tinggi	\N	\N	\N	\N	\N	\N
PRU005	PERUSAHAAN	PT Global Teknindo	Jl. TB Simatupang No.20, Jaksel	02100006	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	IT	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	0	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita."User" (id, "pegawaiId", phone, email, password, role, "createdAt", "lastIpAddress", "lastOnlineAt") FROM stdin;
cmq66v8ew0008jc78nj47d51a	cmq66v8cx0001jc78fzjhjab8	08120000002	user2@example.com	$2b$10$Zk2KN93cIMH1TzfDD15onOnBLNVVz0unY3GNwr0itforMM2eL9k26	FINANCE	2026-06-09 05:18:02.84	\N	\N
cmq66v8ex000ajc78yfvb0dq0	cmq66v8d10002jc78j8ujs5tg	08120000003	user3@example.com	$2b$10$Zk2KN93cIMH1TzfDD15onOnBLNVVz0unY3GNwr0itforMM2eL9k26	DAILY_ADMIN	2026-06-09 05:18:02.842	\N	\N
cmq66v8f0000cjc78n2xbich0	cmq66v8d30003jc78r7p2h35d	08120000004	user4@example.com	$2b$10$Zk2KN93cIMH1TzfDD15onOnBLNVVz0unY3GNwr0itforMM2eL9k26	MARKETING_STAFF	2026-06-09 05:18:02.845	\N	\N
cmq66v8f2000ejc78orwgy5y4	cmq66v8d50004jc78hue5rieb	08120000005	user5@example.com	$2b$10$Zk2KN93cIMH1TzfDD15onOnBLNVVz0unY3GNwr0itforMM2eL9k26	MARKETING_STAFF	2026-06-09 05:18:02.846	\N	\N
cmq66v8eq0006jc78qx4lbqcr	cmq66v8cq0000jc78h1xi5ccz	08139812503	user1@example.com	$2b$10$Zk2KN93cIMH1TzfDD15onOnBLNVVz0unY3GNwr0itforMM2eL9k26	SUPER_ADMIN	2026-06-09 05:18:02.834	\N	\N
cmq67a4yn001qjc1cl7gitkyz	cmq67a4yn001ojc1chcom9uxp	081398125030	axelsebayang456@gmail.com	$2b$10$mErj7fT0dIDmKFXVJh4jQu8Ag25.JgvRPBJhAy02GYQFCcZ7OxMWS	SUPER_ADMIN	2026-06-09 05:29:38.207	\N	\N
cmq67bagu001sjc1chlp562tm	cmq67bagu001rjc1chivx3ch4		wulan@benefita.com	$2b$10$3kkB5NkEFTIrJYJR/ZBGR.hpxVirZo4Xc0RlTZHUOlqS1cYPotowW	MARKETING_STAFF	2026-06-09 05:30:31.998	\N	\N
cmq67eg2w0024jc1c380hflcx	cmq67eg2w0023jc1cq2v2qets	-	sylva@benefita.com	$2b$10$jX8NKFBtJ2OuCXx5htWP5uFY7OX1TjKp1AZ15Hgdbw0qe.FrC/P3.	MARKETING_STAFF	2026-06-09 05:32:59.24	\N	\N
cmq67feia0028jc1c1p5qn3nc	cmq67feia0027jc1chy4j53k6	--	zirah@benefita.com	$2b$10$u0kcq1zr0akX1AiDgJt1sOLzYCcgrRzy5DqOoHJCLYaLVKPA5I8hW	FINANCE	2026-06-09 05:33:43.858	\N	\N
cmq67jqy70003jcs8despfd2l	cmq67jqy60002jcs8cejwgbhd	08932842213	ghifari@gmail.com	$2b$10$kowIIT7gKc7xYxHhPCuS1e1waTnYebumXApd9WLU7ZZ7kKwapDetG	TEKNIS	2026-06-09 05:37:06.607	\N	\N
cmq67m7fm0001jc4wiojl5pja	cmq67m7fm0000jc4wafuhw4j6	082311834322	nanang@benefita.com	$2b$10$qviFYqUIZueldmv8PGsjqeOE1bbeTW2pB3YCdk96FDGmm.GQlznuy	ADMIN	2026-06-09 05:39:01.282	\N	\N
cmq67n6n40003jc4w4w4qx9om	cmq67n6n30002jc4waspqbbcz	081219734045	mulyadi@benefita.com	$2b$10$g1HHwxglvBTMqeOJHKjqxeplHw/azQwJNAxP31Hnbc7aP46P4MeE6	SUPER_ADMIN	2026-06-09 05:39:46.912	\N	\N
cmq67oa810005jc4wjzy9n2al	cmq67oa800004jc4wzfnrwspn	082112597455	habibie@benefita.com	$2b$10$JOixuU6PtXqTdf62gge6he1br5z9asYMVs/kFT7OVjHtD1GgP1kWK	SUPER_ADMIN	2026-06-09 05:40:38.209	\N	\N
cmq67p4o30007jc4wgsr5y6d2	cmq67p4o30006jc4w3vp1um2l	---	syukraini@benefita.com	$2b$10$mfKSlDoyqkcIYSUkDVfhH.4rHgWMCXkZaCV.rKzAyfSj2ajWOCGlm	SUPER_ADMIN	2026-06-09 05:41:17.668	\N	\N
cmq67px7w0009jc4w73e8u51l	cmq67px7v0008jc4wr1hcindk	085220928595	arief@benefita.com	$2b$10$n0lkn1BwL4yBx9It9dVzp.mt7aZdOjwh3FjDacd5q0k/Bd7ucKL46	ADMIN	2026-06-09 05:41:54.668	\N	\N
cmq67qist000djc4w6srup7na	cmq67qist000cjc4wq0nz96c3	-----	eni@benefita.com	$2b$10$tQiuI9OnRghb13USF2RZvub.6JgkXNwPrO5JV/9KMH9N2yCj2hKda	MARKETING_STAFF	2026-06-09 05:42:22.638	\N	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3a13dd83-3a9a-42fc-9aba-cc74e937b744	08af03a008904e98aea935b87ddbbd8761f0c727ea728dc94dc4cf5ca28b04e5	2026-06-09 12:18:02.119325+07	20260528224623_new_field	\N	\N	2026-06-09 12:18:02.117999+07	1
22369cfa-2d95-4139-89e9-acfcf356fa05	8cfe256e7a9d3f76bb6deda74ef3981b16293445780fc91daf01fefc7cf47156	2026-06-09 12:18:01.945558+07	20260306033048_init_database	\N	\N	2026-06-09 12:18:01.926217+07	1
109157d9-fe69-4401-bf8c-4438f6b2da5a	5b6612ee2a711a2b8c6a39b177cefafdbe94a42b0dd371a2857f4e0919abb2e9	2026-06-09 12:18:02.06882+07	20260511175213_riwayat	\N	\N	2026-06-09 12:18:02.055534+07	1
3834f6f4-a101-4494-9e64-f3ec05165bc2	2401c2663837c6a24a0ef6a3b2d5a49e3b826bca710394679007ce19d9fc7f92	2026-06-09 12:18:01.958064+07	20260306042349_otp	\N	\N	2026-06-09 12:18:01.945964+07	1
6660b335-e171-429f-889b-ccf0ebc64799	2b7a379fde1d7a8621a09f1e3729b53460424724e435147fc57dd6d164864f3a	2026-06-09 12:18:01.960052+07	20260306042456_otp_fix	\N	\N	2026-06-09 12:18:01.958413+07	1
0515e7c4-47a0-40f0-b7c6-d9ed37de9784	d159f8d71af58624e189061ffc8d95c7d68bd7add8f7bfe470851cfbcc8b1ac1	2026-06-09 12:18:01.966464+07	20260509195310_init_tabperusahaan	\N	\N	2026-06-09 12:18:01.960408+07	1
7222cc9a-4b31-4311-beb0-3c5a2035fe2b	d9e5b88b4806adf2bb0acfab8d102e18e4296506a903d8a9ee37f3a02f5cd809	2026-06-09 12:18:02.077245+07	20260524154717_add_tab_pos_perusahaan	\N	\N	2026-06-09 12:18:02.069244+07	1
1d20ce3c-5d24-4bf4-83b9-96e7c5afe18a	d7dba03161be04fc64a7c29315087c224ab10ebb0a6899094bf932f8fdd53477	2026-06-09 12:18:01.974813+07	20260509213008_init_tabperusahaan	\N	\N	2026-06-09 12:18:01.966796+07	1
ae6bcf7f-3845-4ff8-b99a-3fb1120e6dbc	baac91471b0e61400bedc24829c8a7632b0671078ca1ed7e1eebb32679b4d72f	2026-06-09 12:18:01.978721+07	20260509224034_add_missing_fields_tabperusahaan	\N	\N	2026-06-09 12:18:01.975243+07	1
aaa5a166-e211-477e-a892-c7d2dfa72faf	78eb6521c88484e3ee3f21b9e02d57ed3f920bc3157ea670b1e57245befa5e91	2026-06-09 12:18:02.170272+07	20260607171258_judul_training	\N	\N	2026-06-09 12:18:02.161793+07	1
7f821da8-5c62-45bf-8a30-f9edbaa8b180	77adf6e760a35072bf1c8894c0494c038b5fbe59ca76419643fdf3423c6c2f0c	2026-06-09 12:18:01.987222+07	20260510172303_add_contact_person_perusahaan	\N	\N	2026-06-09 12:18:01.979207+07	1
f88247e9-5ba3-4697-8171-16429b40a76a	603cd7efe3241c1863e658622ae37111918a813a8ffa7d08a621a23cdfddcd2c	2026-06-09 12:18:02.085281+07	20260524160420_add_acc_to_tab_pos_perusahaan	\N	\N	2026-06-09 12:18:02.07781+07	1
9cf5609e-e912-4440-b032-03844323a79c	4bd7e72f3bb0b88d651fa543b8a6358dc2fcd206042fe8b3f317a701f9257165	2026-06-09 12:18:01.999621+07	20260510184000_add_dailt	\N	\N	2026-06-09 12:18:01.988118+07	1
f038c4e1-8d14-4335-8060-64951b1036b1	921fc749c993675087f02a6f86da76f75d5789eeecb10ad7576ee9796d85acb1	2026-06-09 12:18:02.001761+07	20260510192032_add_dailt	\N	\N	2026-06-09 12:18:02.000079+07	1
a43d03b8-be1d-4257-bb58-2e9f52fa7233	4f113ca1768b72b18d1c484843c9b80022457a65d9ab78a5a0f34c5e8e7f6a2e	2026-06-09 12:18:02.120717+07	20260604211737_nama_migration	\N	\N	2026-06-09 12:18:02.119619+07	1
d3cbde92-fedd-42a6-a561-36f368d82fb5	001fde9bcec6926169480ebb1003c5109769a61b995e31e428b0b084e57ffaee	2026-06-09 12:18:02.009446+07	20260511131140_add_relasi_hak_akses	\N	\N	2026-06-09 12:18:02.002142+07	1
e131f669-d00f-423c-9cde-c4ca909a5cc5	c42c2fa2f3518d380c6b46800a00f14464503bc45f852ece0a0dbf5fbef5bf07	2026-06-09 12:18:02.089963+07	20260524164954_add_penawaran	\N	\N	2026-06-09 12:18:02.085796+07	1
5f8bd3d4-64d2-4e35-97ce-43069960153e	bee41ffdf0407862704bdaba3822dc5f3ae30c9ca67a4aabc9f9336c10d9da27	2026-06-09 12:18:02.039535+07	20260511131458_make_pegawai_id_nullable	\N	\N	2026-06-09 12:18:02.010264+07	1
646195d8-1ff5-46fc-bf76-249c91b9c677	3e74ce1ffc8ebf0bd79ca477c7d2983bd6346e1e4c04cf38ce36de13bc83e665	2026-06-09 12:18:02.048714+07	20260511135633_add_departemen	\N	\N	2026-06-09 12:18:02.040461+07	1
5b605084-b62a-496e-bed3-cedc40ee07e4	20ab3cac7d834b1906dbec4669442eba0a4da71820256234153f079d2b505cbe	2026-06-09 12:18:02.05501+07	20260511135803_add_pegawai	\N	\N	2026-06-09 12:18:02.049713+07	1
83909c2e-9ce5-48c0-adc2-d1046ace523f	4bb4facc4ee9cd8ea2b2f0eefedde271508879272653beaad128e05a872fda1b	2026-06-09 12:18:02.091877+07	20260524165514_update_penawaran_optional_file_date	\N	\N	2026-06-09 12:18:02.09031+07	1
726314bc-6ec4-42e7-a61d-043f6ef50252	35a85cfa1492d7438ee32604ab27f220e9f774a8ea23d0ad5c5601fd259f66f7	2026-06-09 12:18:02.155168+07	20260607161158_add_pengajuan_judul	\N	\N	2026-06-09 12:18:02.145888+07	1
991964fc-25f9-4d6e-81a5-a07f57f9cb6a	cbc2249b2beb03e65057f99dd1ca2bff198fc23ef12910309cd3e7f2bfb8d16e	2026-06-09 12:18:02.094567+07	20260524171322_update_penawaran_optional_file_date	\N	\N	2026-06-09 12:18:02.092322+07	1
ddba05b9-1e6e-402c-b0c5-242f64c7494b	9aeb374422a19df728f7b978ff952071a4bea8d102f35b45173fb3f09301829f	2026-06-09 12:18:02.130314+07	20260604220123_add_new	\N	\N	2026-06-09 12:18:02.120995+07	1
54630881-e182-42fa-9b2f-f1f5e31f143c	880ac45d95078e02b073cf99cc6c513a35ab92b5ad37ed41d74f3753fc95204b	2026-06-09 12:18:02.101495+07	20260524202012_update_request	\N	\N	2026-06-09 12:18:02.095452+07	1
18d36b1b-1812-4f1a-93e2-bdc20b1584a3	db9f16d2b1162d7a42e3439050325e86456e56e3f9808cc881c65cec1942264c	2026-06-09 12:18:02.117672+07	20260528223026_tabperusahaan_final	\N	\N	2026-06-09 12:18:02.101947+07	1
862fbcad-1b0f-491f-b5cd-3d82d5b7f199	ededeec8f99dca1d3339605dfe8e420f63187cddd13e7a59cb17b3b75e92e48e	2026-06-09 12:18:02.133584+07	20260607104652_add_penawaran_perusahaan_relation	\N	\N	2026-06-09 12:18:02.130689+07	1
bd692885-4a93-4fa4-854d-12df59242310	595a525424e6568d0c3bf86ef8a776ca42bfc58e4f7a1a3034199f332a694887	2026-06-09 12:18:02.157143+07	20260607161454_add_pengajuan_judul_date	\N	\N	2026-06-09 12:18:02.155637+07	1
55aff4da-f76a-4939-9a88-58cdd3b2952f	8a090bbaac02b5dab66c09a065eb1f18b097b8f81edf9646220313d9331e3d06	2026-06-09 12:18:02.139691+07	20260607144956_add_hotel	\N	\N	2026-06-09 12:18:02.133991+07	1
cddeee02-c3d9-4714-8dca-e1cca2370e91	13cf53fe775766d7a9dd936828411f995166247e45e263cdbc4376e5796aa90c	2026-06-09 12:18:02.145485+07	20260607151855_add_trainer	\N	\N	2026-06-09 12:18:02.140167+07	1
04dbed6e-f107-4111-b5fe-a2a1ed6d716a	19198cd1641db855ced558fd3863bf9a91a7265d501e98f99facf1a797bf91c0	2026-06-09 12:18:02.204174+07	20260607195008_input_data	\N	\N	2026-06-09 12:18:02.20126+07	1
d29b7907-2e2f-4b00-b3a7-aefdeff70fde	7defa0230740966d2188b689a9fd201945d2bd55f9c64c85c279c265357b8368	2026-06-09 12:18:02.160985+07	20260607165013_add_pengajuan_judul_status	\N	\N	2026-06-09 12:18:02.157589+07	1
8abfb235-3caf-4672-92b4-833719d6e463	8b4983b95676d794d526c32a6ece1eaa3c87b4c5be3ac5bb0ecd2fc6e2178593	2026-06-09 12:18:02.20069+07	20260607194101_input_data	\N	\N	2026-06-09 12:18:02.191574+07	1
1419fa1e-c88e-43ef-a389-d0d3aa58e7b1	710cd26b2a56759ab31d0ebfd52915de47496ce472fbc17754452b345e66a195	2026-06-09 12:18:02.188225+07	20260607180349_jadwal_training	\N	\N	2026-06-09 12:18:02.170772+07	1
f72b3a13-eb49-404c-8984-2b5cb4d03a22	2391c01d4660dfa9dd37d46ce7a5cd109e44cdb7b43d7875344828d89509a354	2026-06-09 12:18:02.191175+07	20260607183239_jadwal_training	\N	\N	2026-06-09 12:18:02.188644+07	1
5234eca1-9cf7-4df2-953d-0a23534a8447	0dc8374e33aabb5183a8f5af85f674400380b946e8357540f8d9708b070d7d1a	2026-06-09 12:18:02.205585+07	20260607195259_input_data_update2	\N	\N	2026-06-09 12:18:02.204554+07	1
05ae4a24-677c-420d-b6d6-7d299a4b8315	201f8a6e8e0363d83af936287515dd90c8df924e483409dc9cfe7de1900b8b5a	2026-06-09 12:18:02.207743+07	20260607195844_input_data_update3	\N	\N	2026-06-09 12:18:02.20597+07	1
c8e57e61-2e92-4f56-87e3-9c3693506194	ed0c2913aaa7cc3e79d6ccd6f83cdfac78f6c953be8c53457216321a7d0d127a	2026-06-09 12:18:02.216717+07	20260607203312_input_data_update7	\N	\N	2026-06-09 12:18:02.208656+07	1
a04c576b-a1dc-4a62-9dd2-68116f8c076b	17e3a779f9b221622e89d3ca42d07fd236f8dde8ca092801903475ab6a135628	2026-06-09 12:18:02.225244+07	20260608102705_pegawai_update	\N	\N	2026-06-09 12:18:02.217161+07	1
38e53fce-d8b3-4a02-99ff-9c6d5ea47e7d	07535c690145008f46b346f64a9656df40555802c86c3da6436d3f4c25896692	2026-06-09 12:18:02.23551+07	20260608114844_izin_cuti	\N	\N	2026-06-09 12:18:02.22586+07	1
24a7cc2f-1fb5-4de6-ac3a-d7e102497536	e10fd359792712849af3b06c621acf5f75019c00b10b0e3d71a590fba9275c3b	2026-06-09 12:18:02.238149+07	20260608115756_izin_cuti2	\N	\N	2026-06-09 12:18:02.235958+07	1
dc5b93f1-ebc8-4776-be8a-fb380ac22363	7418acd64538c95b6c34e9e41f055b3a3f415cb3d0ce90a23f97abf5d4a059bc	2026-06-09 12:18:02.239609+07	20260608134105_login_track	\N	\N	2026-06-09 12:18:02.238524+07	1
a48d38c9-4610-455d-babc-61acb85c7acc	75eb625619f6b8d4fa82628463e4d7ceabd7677a289785096fc562e9ad0c6847	2026-06-09 12:18:02.243624+07	20260608142811_berita	\N	\N	2026-06-09 12:18:02.239892+07	1
1dc6c1d4-b4cc-4f9b-a50f-994cccbf1970	da611946d082951ee7e9c52adc105cb40be48dec2ec8b357ca563737a0c6eb98	2026-06-09 12:18:02.255983+07	20260608151818_surat	\N	\N	2026-06-09 12:18:02.244068+07	1
7e954053-ca4a-4759-a6ff-5c8aaa0a7565	ec1fd5ce09a2960d3cd9d4313cf27cf7b4f233552cba266d305fe61dcde2f793	2026-06-09 12:35:34.937124+07	20260609053534_rolenew	\N	\N	2026-06-09 12:35:34.927758+07	1
f37679ac-d1c9-4bee-8229-145003ee83ee	513f348db02f10501fa17d24450b1f5490377232b3094d9b638b8809ce61b9a3	2026-06-09 12:38:52.587695+07	20260609053852_rolenew	\N	\N	2026-06-09 12:38:52.585261+07	1
\.


--
-- Data for Name: berita; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.berita (id, periode, isi, "createdAt", "updatedAt") FROM stdin;
cmq66v8hs000rjc786qdmq0sj	2025-07-01 00:00:00	Jadwal training K3 bulan Juli 2025 telah dibuka. Segera daftarkan peserta Anda.	2026-06-09 05:18:02.945	2026-06-09 05:18:02.945
cmq66v8hs000sjc78lspphjyg	2025-08-01 00:00:00	Pelatihan AMDAL batch kedua akan dilaksanakan pada Agustus 2025 di Bandung.	2026-06-09 05:18:02.945	2026-06-09 05:18:02.945
cmq66vfbf000rjco8ao8sg28d	2025-07-01 00:00:00	Jadwal training K3 bulan Juli 2025 telah dibuka. Segera daftarkan peserta Anda.	2026-06-09 05:18:11.787	2026-06-09 05:18:11.787
cmq66vfbf000sjco84vdy9tso	2025-08-01 00:00:00	Pelatihan AMDAL batch kedua akan dilaksanakan pada Agustus 2025 di Bandung.	2026-06-09 05:18:11.787	2026-06-09 05:18:11.787
\.


--
-- Data for Name: contact_person_perusahaan; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.contact_person_perusahaan ("KODE", "KODE_PERUSAHAAN", "NAMA", "TEKNIS_TERTINGGI", "JABATAN", "HP", "EMAIL", "POSISI", "KEUANGAN", "MINTA", "KET", created_at, updated_at) FROM stdin;
cmq66v8gb000gjc78rd1pzfzn	PRU001	Hendra Wijaya	f	HRD Manager	08131111111	hendra@majubersama.com	\N	\N	\N	\N	2026-06-09 05:18:02.892	2026-06-09 05:18:02.892
cmq66v8ge000ijc787prci862	PRU002	Rina Marlina	f	Direktur	08132222222	rina@karyaindah.com	\N	\N	\N	\N	2026-06-09 05:18:02.895	2026-06-09 05:18:02.895
cmq66v8gf000kjc78lqnfob9x	RS001	dr. Hadi S.	f	Direktur RS	08133333333	hadi@harapansehat.com	\N	\N	\N	\N	2026-06-09 05:18:02.896	2026-06-09 05:18:02.896
cmq66v8gg000mjc78hqzyhw7y	PMD001	Drs. Sutrisno	f	Kepala Dinas LH	08134444444	sutrisno@pemda-bogor.go.id	\N	\N	\N	\N	2026-06-09 05:18:02.896	2026-06-09 05:18:02.896
cmq66v8gh000ojc7837xjbttx	SKL001	Ibu Sunarti	f	Kepala Sekolah	08135555555	sunarti@smkmaju.sch.id	\N	\N	\N	\N	2026-06-09 05:18:02.897	2026-06-09 05:18:02.897
cmq66vfa1000gjco8jgcm8l4k	PRU001	Hendra Wijaya	f	HRD Manager	08131111111	hendra@majubersama.com	\N	\N	\N	\N	2026-06-09 05:18:11.738	2026-06-09 05:18:11.738
cmq66vfa4000ijco8vi8waxls	PRU002	Rina Marlina	f	Direktur	08132222222	rina@karyaindah.com	\N	\N	\N	\N	2026-06-09 05:18:11.74	2026-06-09 05:18:11.74
cmq66vfa4000kjco8b855xbo3	RS001	dr. Hadi S.	f	Direktur RS	08133333333	hadi@harapansehat.com	\N	\N	\N	\N	2026-06-09 05:18:11.741	2026-06-09 05:18:11.741
cmq66vfa5000mjco8tsyworra	PMD001	Drs. Sutrisno	f	Kepala Dinas LH	08134444444	sutrisno@pemda-bogor.go.id	\N	\N	\N	\N	2026-06-09 05:18:11.742	2026-06-09 05:18:11.742
cmq66vfa6000ojco8atda690a	SKL001	Ibu Sunarti	f	Kepala Sekolah	08135555555	sunarti@smkmaju.sch.id	\N	\N	\N	\N	2026-06-09 05:18:11.742	2026-06-09 05:18:11.742
\.


--
-- Data for Name: daily_activity; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.daily_activity ("ID", "PEGAWAI_ID", "PERUSAHAAN_ID", "KONTAK", "JENIS_TRAINING", "KETERANGAN", "KATEGORI", "INOUT", "TANGGAL", "PERUSAHAAN", created_at, updated_at, "DATE_TARGET") FROM stdin;
cmq66v8ho000pjc78siaz5ch3	cmq66v8d30003jc78r7p2h35d	PRU001	Hendra Wijaya	K3 Umum	Follow up pendaftaran peserta	FOLLOW_UP	OUT	2025-07-01	PT Maju Bersama	2026-06-09 05:18:02.94	2026-06-09 05:18:02.94	\N
cmq66v8ho000qjc784gird7uy	cmq66v8d30003jc78r7p2h35d	PRU002	Rina Marlina	AMDAL Dasar	Presentasi program training	PRESENTASI	OUT	2025-07-02	PT Karya Indah	2026-06-09 05:18:02.94	2026-06-09 05:18:02.94	\N
cmq66vfbc000pjco89ebpb7wo	cmq66v8d30003jc78r7p2h35d	PRU001	Hendra Wijaya	K3 Umum	Follow up pendaftaran peserta	FOLLOW_UP	OUT	2025-07-01	PT Maju Bersama	2026-06-09 05:18:11.785	2026-06-09 05:18:11.785	\N
cmq66vfbc000qjco8x61bw6n2	cmq66v8d30003jc78r7p2h35d	PRU002	Rina Marlina	AMDAL Dasar	Presentasi program training	PRESENTASI	OUT	2025-07-02	PT Karya Indah	2026-06-09 05:18:11.785	2026-06-09 05:18:11.785	\N
\.


--
-- Data for Name: hotel; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.hotel (id, kode_hotel, nama_hotel, alamat, kota, telepon, fax, pub_rate, cor_rate, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: jadwal_training; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.jadwal_training (id, "noJadwal", "kodePelatihan", "tglMulai", "tglSelesai", "judulLengkap", "judulPendek", metode, "jenisTraining", kota, "lokasiDetail", biaya, catatan, "fileAgenda", "lastUpdate", "updateOleh", status) FROM stdin;
4	2026142	ISO-001	2026-06-10 00:00:00	2026-06-16 00:00:00	Pelatihan BoQ	PBOQ	Offline	Refreshment	Bandung	Hotel Hilton	5900000	-	\N	2026-06-09 06:12:48.296	cmq67a4yn001ojc1chcom9uxp	TERKONFIRMASI
1	JDW-2025-001	K3-001	2025-07-10 00:00:00	2026-06-09 00:00:00	Pelatihan K3 Umum Batch 1 2025	K3 Umum	offline	publik	Jakarta	Hotel Santika Jakarta	3500000	\N	\N	2026-06-09 06:15:21.901	cmq67a4yn001ojc1chcom9uxp	TERKONFIRMASI
3	JDW-2025-003	ISO-001	2025-08-05 00:00:00	2026-12-06 00:00:00	ISO 14001 Awareness Batch 1 2025	ISO 14001	offline	publik	Bandung	Hotel Papandayan Bandung	3000000	\N	\N	2026-06-09 06:15:45.53	cmq67a4yn001ojc1chcom9uxp	TERKONFIRMASI
2	JDW-2025-002	LH-001	2025-07-15 00:00:00	2026-02-17 00:00:00	Pelatihan AMDAL Dasar Batch 1 2025	AMDAL Dasar	online	publik	Online	\N	3500000	\N	\N	2026-06-09 06:16:38.885	cmq67a4yn001ojc1chcom9uxp	TERKONFIRMASI
5	2026142fwf	ISO-001	2026-01-15 00:00:00	2026-06-16 00:00:00	Pelatihan BoQ	PBOQ	Offline	Refreshment	Bandung	Hotel Hilton	5900000	geggeg	\N	2026-06-09 06:17:47.021	cmq67a4yn001ojc1chcom9uxp	TERKONFIRMASI
\.


--
-- Data for Name: judul_training; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.judul_training (id, kode, "judulTraining", tipe, hari, "biayaOffline", "biayaOnline", batch, brosur, "createdAt", "updatedAt") FROM stdin;
1	K3-001	K3 Umum	publik	2	3500000	2500000	1	\N	2026-06-09 05:18:02.899	2026-06-09 05:18:02.899
2	LH-001	AMDAL Dasar	publik	3	4500000	3500000	1	\N	2026-06-09 05:18:02.903	2026-06-09 05:18:02.903
3	LH-002	Pengelolaan Limbah B3	inhouse	2	5000000	4000000	1	\N	2026-06-09 05:18:02.904	2026-06-09 05:18:02.904
4	ISO-001	ISO 14001 Awareness	publik	2	3000000	2000000	1	\N	2026-06-09 05:18:02.906	2026-06-09 05:18:02.906
5	ENE-001	Audit Energi	publik	3	4000000	3000000	1	\N	2026-06-09 05:18:02.909	2026-06-09 05:18:02.909
\.


--
-- Data for Name: kontak; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.kontak (id, kode, nama, referensi, alamat, "subjekKhusus", telp, keterangan, email, tugas, kantor, "alamatKantor", "noTelpKantor", "createdAt", "updatedAt") FROM stdin;
1	TR-001	Prof. Dr. Bambang S.	\N	\N	K3 & Lingkungan	08161111111	\N	bambang@trainer.com	\N	\N	\N	\N	2026-06-09 05:18:02.923	2026-06-09 05:18:02.923
2	TR-002	Ir. Wulandari, MT	\N	\N	AMDAL & ISO	08162222222	\N	wulan@trainer.com	\N	\N	\N	\N	2026-06-09 05:18:02.928	2026-06-09 05:18:02.928
\.


--
-- Data for Name: log_perubahan_perusahaan; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.log_perubahan_perusahaan (id, perusahaan_id, field, data_lama, data_baru, diubah_oleh, tanggal) FROM stdin;
\.


--
-- Data for Name: penawaran; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.penawaran (id, "kodePelatihan", tanggal, "filePath", "perusahaanId") FROM stdin;
\.


--
-- Data for Name: pengajuan_judul_training; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.pengajuan_judul_training (id, "judulTraining", "jumlahHari", "namaKontak", kontak, "jumlahPeserta", "perusahaanId", "inputOlehId", "createdAt", "updatedAt", "tanggalPengajuan", "responMA") FROM stdin;
\.


--
-- Data for Name: permintaan_nomor_surat; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.permintaan_nomor_surat (id, "noSurat", keterangan, tanggal_kirim, tipe, tujuan_no_induk, pengirim_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permohonan_hak_akses; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.permohonan_hak_akses (id, perusahaan_id, pegawai_id, jenis_akses, terima, tanggal) FROM stdin;
\.


--
-- Data for Name: peserta_training; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.peserta_training (id, nama, jabatan, alamat, "noTelp", "noFax", email, "alamatPengirimanSertifikat", catatan, industri, status, "noIndukPerusahaan", "noJadwal", ujian, "noInvUjian", "noKwtUjian", diskon, ppn, cashback, "hargaTotal", bayar, "infoPembayaran", "infoPenagihan", "tglBayar", "noInvoice", "noKwitansi", "updateOleh", "konfirmasiOleh", "tglInput", "tglUpdate", "accExecutive", "inputOleh", "ownEnv", metode, "fileBuktiPembayaran", "filePendaftaran") FROM stdin;
1	Agus Setiawan	Staff HSE	\N	08171111111	\N	\N	\N	\N	\N	KONFIRMASI	PRU001	JDW-2025-001	\N	\N	\N	\N	\N	\N	3500000	3500000	\N	\N	\N	\N	\N	\N	\N	2026-06-09 05:18:02.936	2026-06-09 05:18:02.936	\N	cmq66v8d30003jc78r7p2h35d	\N	offline	\N	\N
2	Maya Kusuma	Manager LH	\N	08172222222	\N	\N	\N	\N	\N	KONFIRMASI	PRU002	JDW-2025-001	\N	\N	\N	\N	\N	\N	3500000	3500000	\N	\N	\N	\N	\N	\N	\N	2026-06-09 05:18:02.936	2026-06-09 05:18:02.936	\N	cmq66v8d30003jc78r7p2h35d	\N	offline	\N	\N
3	Eko Prabowo	Supervisor	\N	08173333333	\N	\N	\N	\N	\N	PENDING	RS001	JDW-2025-002	\N	\N	\N	\N	\N	\N	3500000	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-09 05:18:02.936	2026-06-09 05:18:02.936	\N	cmq66v8d30003jc78r7p2h35d	\N	online	\N	\N
4	Agus Setiawan	Staff HSE	\N	08171111111	\N	\N	\N	\N	\N	KONFIRMASI	PRU001	JDW-2025-001	\N	\N	\N	\N	\N	\N	3500000	3500000	\N	\N	\N	\N	\N	\N	\N	2026-06-09 05:18:11.779	2026-06-09 05:18:11.779	\N	cmq66v8d30003jc78r7p2h35d	\N	offline	\N	\N
5	Maya Kusuma	Manager LH	\N	08172222222	\N	\N	\N	\N	\N	KONFIRMASI	PRU002	JDW-2025-001	\N	\N	\N	\N	\N	\N	3500000	3500000	\N	\N	\N	\N	\N	\N	\N	2026-06-09 05:18:11.779	2026-06-09 05:18:11.779	\N	cmq66v8d30003jc78r7p2h35d	\N	offline	\N	\N
6	Eko Prabowo	Supervisor	\N	08173333333	\N	\N	\N	\N	\N	PENDING	RS001	JDW-2025-002	\N	\N	\N	\N	\N	\N	3500000	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-09 05:18:11.779	2026-06-09 05:18:11.779	\N	cmq66v8d30003jc78r7p2h35d	\N	online	\N	\N
\.


--
-- Data for Name: tabposperusahaan; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.tabposperusahaan (id, nama, jabatan, "FOLLOW_UP", "NO_INDUK", "ACC") FROM stdin;
\.


--
-- Data for Name: trainer_on_jadwal; Type: TABLE DATA; Schema: benefita; Owner: postgres
--

COPY benefita.trainer_on_jadwal ("jadwalId", "trainerKode") FROM stdin;
4	TR-002
4	TR-001
\.


--
-- Name: Proper_id_seq; Type: SEQUENCE SET; Schema: benefita; Owner: postgres
--

SELECT pg_catalog.setval('benefita."Proper_id_seq"', 1, false);


--
-- Name: SertifikasiBnsp_id_seq; Type: SEQUENCE SET; Schema: benefita; Owner: postgres
--

SELECT pg_catalog.setval('benefita."SertifikasiBnsp_id_seq"', 1, false);


--
-- Name: jadwal_training_id_seq; Type: SEQUENCE SET; Schema: benefita; Owner: postgres
--

SELECT pg_catalog.setval('benefita.jadwal_training_id_seq', 5, true);


--
-- Name: judul_training_id_seq; Type: SEQUENCE SET; Schema: benefita; Owner: postgres
--

SELECT pg_catalog.setval('benefita.judul_training_id_seq', 5, true);


--
-- Name: kontak_id_seq; Type: SEQUENCE SET; Schema: benefita; Owner: postgres
--

SELECT pg_catalog.setval('benefita.kontak_id_seq', 2, true);


--
-- Name: permintaan_nomor_surat_id_seq; Type: SEQUENCE SET; Schema: benefita; Owner: postgres
--

SELECT pg_catalog.setval('benefita.permintaan_nomor_surat_id_seq', 1, false);


--
-- Name: peserta_training_id_seq; Type: SEQUENCE SET; Schema: benefita; Owner: postgres
--

SELECT pg_catalog.setval('benefita.peserta_training_id_seq', 6, true);


--
-- Name: BuktiIzin BuktiIzin_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."BuktiIzin"
    ADD CONSTRAINT "BuktiIzin_pkey" PRIMARY KEY (id);


--
-- Name: DeviceTrusted DeviceTrusted_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."DeviceTrusted"
    ADD CONSTRAINT "DeviceTrusted_pkey" PRIMARY KEY (id);


--
-- Name: DokumenPegawai DokumenPegawai_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."DokumenPegawai"
    ADD CONSTRAINT "DokumenPegawai_pkey" PRIMARY KEY (id);


--
-- Name: HakAksesKaryawan HakAksesKaryawan_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."HakAksesKaryawan"
    ADD CONSTRAINT "HakAksesKaryawan_pkey" PRIMARY KEY (id);


--
-- Name: OtpCode OtpCode_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."OtpCode"
    ADD CONSTRAINT "OtpCode_pkey" PRIMARY KEY (id);


--
-- Name: Pegawai Pegawai_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."Pegawai"
    ADD CONSTRAINT "Pegawai_pkey" PRIMARY KEY (id);


--
-- Name: PengajuanIzin PengajuanIzin_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."PengajuanIzin"
    ADD CONSTRAINT "PengajuanIzin_pkey" PRIMARY KEY (id);


--
-- Name: Proper Proper_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."Proper"
    ADD CONSTRAINT "Proper_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: SertifikasiBnsp SertifikasiBnsp_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."SertifikasiBnsp"
    ADD CONSTRAINT "SertifikasiBnsp_pkey" PRIMARY KEY (id);


--
-- Name: TabPerusahaan TabPerusahaan_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."TabPerusahaan"
    ADD CONSTRAINT "TabPerusahaan_pkey" PRIMARY KEY ("0NO_INDUK");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: berita berita_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.berita
    ADD CONSTRAINT berita_pkey PRIMARY KEY (id);


--
-- Name: contact_person_perusahaan contact_person_perusahaan_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.contact_person_perusahaan
    ADD CONSTRAINT contact_person_perusahaan_pkey PRIMARY KEY ("KODE");


--
-- Name: daily_activity daily_activity_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.daily_activity
    ADD CONSTRAINT daily_activity_pkey PRIMARY KEY ("ID");


--
-- Name: hotel hotel_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.hotel
    ADD CONSTRAINT hotel_pkey PRIMARY KEY (id);


--
-- Name: jadwal_training jadwal_training_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.jadwal_training
    ADD CONSTRAINT jadwal_training_pkey PRIMARY KEY (id);


--
-- Name: judul_training judul_training_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.judul_training
    ADD CONSTRAINT judul_training_pkey PRIMARY KEY (id);


--
-- Name: kontak kontak_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.kontak
    ADD CONSTRAINT kontak_pkey PRIMARY KEY (id);


--
-- Name: log_perubahan_perusahaan log_perubahan_perusahaan_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.log_perubahan_perusahaan
    ADD CONSTRAINT log_perubahan_perusahaan_pkey PRIMARY KEY (id);


--
-- Name: penawaran penawaran_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.penawaran
    ADD CONSTRAINT penawaran_pkey PRIMARY KEY (id);


--
-- Name: pengajuan_judul_training pengajuan_judul_training_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.pengajuan_judul_training
    ADD CONSTRAINT pengajuan_judul_training_pkey PRIMARY KEY (id);


--
-- Name: permintaan_nomor_surat permintaan_nomor_surat_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.permintaan_nomor_surat
    ADD CONSTRAINT permintaan_nomor_surat_pkey PRIMARY KEY (id);


--
-- Name: permohonan_hak_akses permohonan_hak_akses_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.permohonan_hak_akses
    ADD CONSTRAINT permohonan_hak_akses_pkey PRIMARY KEY (id);


--
-- Name: peserta_training peserta_training_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.peserta_training
    ADD CONSTRAINT peserta_training_pkey PRIMARY KEY (id);


--
-- Name: tabposperusahaan tabposperusahaan_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.tabposperusahaan
    ADD CONSTRAINT tabposperusahaan_pkey PRIMARY KEY (id);


--
-- Name: trainer_on_jadwal trainer_on_jadwal_pkey; Type: CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.trainer_on_jadwal
    ADD CONSTRAINT trainer_on_jadwal_pkey PRIMARY KEY ("jadwalId", "trainerKode");


--
-- Name: DeviceTrusted_userId_deviceHash_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX "DeviceTrusted_userId_deviceHash_key" ON benefita."DeviceTrusted" USING btree ("userId", "deviceHash");


--
-- Name: Pegawai_nip_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX "Pegawai_nip_key" ON benefita."Pegawai" USING btree (nip);


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON benefita."RefreshToken" USING btree (token);


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE INDEX "RefreshToken_userId_idx" ON benefita."RefreshToken" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON benefita."User" USING btree (email);


--
-- Name: User_pegawaiId_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX "User_pegawaiId_key" ON benefita."User" USING btree ("pegawaiId");


--
-- Name: User_phone_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX "User_phone_key" ON benefita."User" USING btree (phone);


--
-- Name: contact_person_perusahaan_KODE_PERUSAHAAN_idx; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE INDEX "contact_person_perusahaan_KODE_PERUSAHAAN_idx" ON benefita.contact_person_perusahaan USING btree ("KODE_PERUSAHAAN");


--
-- Name: daily_activity_PEGAWAI_ID_idx; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE INDEX "daily_activity_PEGAWAI_ID_idx" ON benefita.daily_activity USING btree ("PEGAWAI_ID");


--
-- Name: daily_activity_PERUSAHAAN_ID_idx; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE INDEX "daily_activity_PERUSAHAAN_ID_idx" ON benefita.daily_activity USING btree ("PERUSAHAAN_ID");


--
-- Name: hotel_kode_hotel_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX hotel_kode_hotel_key ON benefita.hotel USING btree (kode_hotel);


--
-- Name: jadwal_training_noJadwal_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX "jadwal_training_noJadwal_key" ON benefita.jadwal_training USING btree ("noJadwal");


--
-- Name: judul_training_kode_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX judul_training_kode_key ON benefita.judul_training USING btree (kode);


--
-- Name: kontak_kode_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX kontak_kode_key ON benefita.kontak USING btree (kode);


--
-- Name: log_perubahan_perusahaan_perusahaan_id_idx; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE INDEX log_perubahan_perusahaan_perusahaan_id_idx ON benefita.log_perubahan_perusahaan USING btree (perusahaan_id);


--
-- Name: permintaan_nomor_surat_noSurat_key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX "permintaan_nomor_surat_noSurat_key" ON benefita.permintaan_nomor_surat USING btree ("noSurat");


--
-- Name: permintaan_nomor_surat_tujuan_no_induk_pengirim_id_tanggal__key; Type: INDEX; Schema: benefita; Owner: postgres
--

CREATE UNIQUE INDEX permintaan_nomor_surat_tujuan_no_induk_pengirim_id_tanggal__key ON benefita.permintaan_nomor_surat USING btree (tujuan_no_induk, pengirim_id, tanggal_kirim);


--
-- Name: BuktiIzin BuktiIzin_pengajuanIzinId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."BuktiIzin"
    ADD CONSTRAINT "BuktiIzin_pengajuanIzinId_fkey" FOREIGN KEY ("pengajuanIzinId") REFERENCES benefita."PengajuanIzin"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeviceTrusted DeviceTrusted_userId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."DeviceTrusted"
    ADD CONSTRAINT "DeviceTrusted_userId_fkey" FOREIGN KEY ("userId") REFERENCES benefita."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DokumenPegawai DokumenPegawai_pegawaiId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."DokumenPegawai"
    ADD CONSTRAINT "DokumenPegawai_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HakAksesKaryawan HakAksesKaryawan_pegawaiId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."HakAksesKaryawan"
    ADD CONSTRAINT "HakAksesKaryawan_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HakAksesKaryawan HakAksesKaryawan_perusahaanId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."HakAksesKaryawan"
    ADD CONSTRAINT "HakAksesKaryawan_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OtpCode OtpCode_userId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."OtpCode"
    ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES benefita."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PengajuanIzin PengajuanIzin_pegawaiId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."PengajuanIzin"
    ADD CONSTRAINT "PengajuanIzin_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Proper Proper_perusahaanId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."Proper"
    ADD CONSTRAINT "Proper_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES benefita."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SertifikasiBnsp SertifikasiBnsp_perusahaanId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."SertifikasiBnsp"
    ADD CONSTRAINT "SertifikasiBnsp_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_pegawaiId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita."User"
    ADD CONSTRAINT "User_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contact_person_perusahaan contact_person_perusahaan_KODE_PERUSAHAAN_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.contact_person_perusahaan
    ADD CONSTRAINT "contact_person_perusahaan_KODE_PERUSAHAAN_fkey" FOREIGN KEY ("KODE_PERUSAHAAN") REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: daily_activity daily_activity_PEGAWAI_ID_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.daily_activity
    ADD CONSTRAINT "daily_activity_PEGAWAI_ID_fkey" FOREIGN KEY ("PEGAWAI_ID") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: daily_activity daily_activity_PERUSAHAAN_ID_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.daily_activity
    ADD CONSTRAINT "daily_activity_PERUSAHAAN_ID_fkey" FOREIGN KEY ("PERUSAHAAN_ID") REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: jadwal_training jadwal_training_kodePelatihan_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.jadwal_training
    ADD CONSTRAINT "jadwal_training_kodePelatihan_fkey" FOREIGN KEY ("kodePelatihan") REFERENCES benefita.judul_training(kode) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: jadwal_training jadwal_training_updateOleh_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.jadwal_training
    ADD CONSTRAINT "jadwal_training_updateOleh_fkey" FOREIGN KEY ("updateOleh") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: log_perubahan_perusahaan log_perubahan_perusahaan_perusahaan_id_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.log_perubahan_perusahaan
    ADD CONSTRAINT log_perubahan_perusahaan_perusahaan_id_fkey FOREIGN KEY (perusahaan_id) REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: penawaran penawaran_perusahaanId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.penawaran
    ADD CONSTRAINT "penawaran_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengajuan_judul_training pengajuan_judul_training_inputOlehId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.pengajuan_judul_training
    ADD CONSTRAINT "pengajuan_judul_training_inputOlehId_fkey" FOREIGN KEY ("inputOlehId") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pengajuan_judul_training pengajuan_judul_training_perusahaanId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.pengajuan_judul_training
    ADD CONSTRAINT "pengajuan_judul_training_perusahaanId_fkey" FOREIGN KEY ("perusahaanId") REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permintaan_nomor_surat permintaan_nomor_surat_pengirim_id_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.permintaan_nomor_surat
    ADD CONSTRAINT permintaan_nomor_surat_pengirim_id_fkey FOREIGN KEY (pengirim_id) REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permintaan_nomor_surat permintaan_nomor_surat_tujuan_no_induk_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.permintaan_nomor_surat
    ADD CONSTRAINT permintaan_nomor_surat_tujuan_no_induk_fkey FOREIGN KEY (tujuan_no_induk) REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permohonan_hak_akses permohonan_hak_akses_pegawai_id_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.permohonan_hak_akses
    ADD CONSTRAINT permohonan_hak_akses_pegawai_id_fkey FOREIGN KEY (pegawai_id) REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: permohonan_hak_akses permohonan_hak_akses_perusahaan_id_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.permohonan_hak_akses
    ADD CONSTRAINT permohonan_hak_akses_perusahaan_id_fkey FOREIGN KEY (perusahaan_id) REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: peserta_training peserta_training_inputOleh_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.peserta_training
    ADD CONSTRAINT "peserta_training_inputOleh_fkey" FOREIGN KEY ("inputOleh") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: peserta_training peserta_training_konfirmasiOleh_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.peserta_training
    ADD CONSTRAINT "peserta_training_konfirmasiOleh_fkey" FOREIGN KEY ("konfirmasiOleh") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: peserta_training peserta_training_noIndukPerusahaan_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.peserta_training
    ADD CONSTRAINT "peserta_training_noIndukPerusahaan_fkey" FOREIGN KEY ("noIndukPerusahaan") REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: peserta_training peserta_training_noJadwal_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.peserta_training
    ADD CONSTRAINT "peserta_training_noJadwal_fkey" FOREIGN KEY ("noJadwal") REFERENCES benefita.jadwal_training("noJadwal") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: peserta_training peserta_training_updateOleh_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.peserta_training
    ADD CONSTRAINT "peserta_training_updateOleh_fkey" FOREIGN KEY ("updateOleh") REFERENCES benefita."Pegawai"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tabposperusahaan tabposperusahaan_NO_INDUK_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.tabposperusahaan
    ADD CONSTRAINT "tabposperusahaan_NO_INDUK_fkey" FOREIGN KEY ("NO_INDUK") REFERENCES benefita."TabPerusahaan"("0NO_INDUK") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trainer_on_jadwal trainer_on_jadwal_jadwalId_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.trainer_on_jadwal
    ADD CONSTRAINT "trainer_on_jadwal_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES benefita.jadwal_training(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trainer_on_jadwal trainer_on_jadwal_trainerKode_fkey; Type: FK CONSTRAINT; Schema: benefita; Owner: postgres
--

ALTER TABLE ONLY benefita.trainer_on_jadwal
    ADD CONSTRAINT "trainer_on_jadwal_trainerKode_fkey" FOREIGN KEY ("trainerKode") REFERENCES benefita.kontak(kode) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 3hGjHAi7vYGdyFJLFhT2CPVuroyhVw1gcQ171uCmR58DooAnjHpgCqZdWYSFanr

