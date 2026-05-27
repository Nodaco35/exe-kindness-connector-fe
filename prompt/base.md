# Tài Liệu Hướng Dẫn Khởi Tạo Base Dự Án Next.js (Modular / Feature-Based) - Không Dùng Thư Mục SRC

Tôi đang làm một dự án Next.js cá nhân sử dụng App Router. Tôi muốn tổ chức cấu trúc mã nguồn theo hướng **Feature-Based (Modular)** giống như tư duy đóng gói của NestJS, kết hợp với cơ chế SSR để tối ưu SEO. 

**Lưu ý đặc biệt:** Dự án của tôi KHÔNG sử dụng thư mục `src/`. Tất cả các thư mục chính đều nằm ngay tại thư mục gốc (root) của dự án.

Hãy giữ nguyên cấu trúc thư mục và quy tắc thiết kế dưới đây để tạo cho tôi toàn bộ khung thư mục rỗng và viết mã nguồn hoàn chỉnh cho các file hệ thống cốt lõi cùng một module mẫu.

---

### 1. Cấu trúc tổng thể dự án (Nằm ngay tại thư mục gốc / Root)
- `app/`: Tầng Định Tuyến (Route Layer). Các file `page.tsx` phải cực kỳ mỏng, chỉ làm nhiệm vụ gọi data trên Server và pass xuống Client Component để tối ưu SEO cấu trúc HTML tĩnh.
- `components/ui/`: Chứa các component nguyên tử dùng chung toàn sàn (Button, Input,...).
- `lib/`: Chứa các cấu hình lõi hệ thống (Axios, Fetch,...).
- `providers/`: Chứa các bộ bọc Context toàn cục (Theme, Auth,...).
- `features/`: Tầng Nghiệp Vụ Chính (Modular Layer). Chia folder theo từng tính năng độc lập.

---

### 2. Yêu cầu chi tiết về cấu trúc của một Module thuộc `features/`
Mỗi tính năng (Ví dụ mẫu là Module `books`) bắt buộc phải được chia làm các tầng file cô lập sau tại thư mục gốc và **không được thay đổi cấu trúc này**:
- `features/books/types.ts`: Định nghĩa kiểu dữ liệu TypeScript cho Sách.
- `features/books/services/endpoints.ts`: Nơi DUY NHẤT định nghĩa các chuỗi String URL (API Routes).
- `features/books/services/book.service.ts`: File TỔNG HỢP toàn bộ các hàm gọi dữ liệu (get, post,...). Hàm sẽ sử dụng instance `api` của hệ thống và gọi chuỗi URL từ file `endpoints.ts` ra.
- `features/books/components/`: Chứa các UI Component biệt lập của riêng tính năng sách (ví dụ: `book-list.tsx`). Component này nhận dữ liệu từ props do Server Component truyền xuống để render HTML tĩnh.
- `features/books/index.ts`: File cửa ngõ (Public API), đóng gói module bằng cách `export * as bookService` để bên ngoài gọi một cách gom cụm.

---

### 3. Yêu cầu viết mã nguồn hoàn chỉnh cho các file sau (Dựng Base)

**File 1: Cấu hình Axios toàn cục (`lib/api-client.ts`)**
Tạo Axios instance, tự động gắn Bearer Token từ localStorage ở Request Interceptor, và bắt lỗi tập trung (ví dụ: nếu gặp lỗi 401 thì xóa token và chuyển hướng về `/login`) ở Response Interceptor.

**File 2: Định nghĩa dữ liệu (`features/books/types.ts`)**
Tạo interface `Book` (id, title, author, coverImage, description) và `BookResponse` (data: Book[], total: number).

**File 3: Quản lý API Route (`features/books/services/endpoints.ts`)**
Khai báo hằng số `BOOK_ENDPOINTS` chứa: `GET_ALL: '/books'`, và `GET_DETAIL: (id: string) => '/books/${id}'`.

**File 4: Hàm gọi dữ liệu (`features/books/services/book.service.ts`)**
Viết các hàm `getBooks()` trả về `Promise<BookResponse>` và `getBookById(id)` sử dụng instance `api` từ `lib/api-client` kết hợp chuỗi URL từ `BOOK_ENDPOINTS`.

**File 5: Giao diện hiển thị (`features/books/components/book-list.tsx`)**
Tạo Client Component nhận props `initialBooks: Book[]` và map ra giao diện grid hiển thị danh sách sách (để Next.js render trước cấu trúc HTML tĩnh trên Server phục vụ Bot SEO).

**File 6: Cửa ngõ đóng gói Module (`features/books/index.ts`)**
Export component `BookList` và export cụm service theo đúng cú pháp: `export * as bookService from './services/book.service';`.

**File 7: Tầng Route phục vụ SEO (`app/books/page.tsx`)**
Tạo một Server Component. Sử dụng hàm `generateMetadata` gọi `bookService.getBooks()` để tạo tiêu đề trang tĩnh tối ưu SEO. Bên trong hàm render chính, tiếp tục gọi `bookService.getBooks()` lấy dữ liệu trên Server rồi truyền thẳng vào `<BookList initialBooks={res.data} />`.

---

*Hãy tạo cấu trúc thư mục rỗng và viết đầy đủ mã nguồn chuẩn chỉnh cho 7 file nêu trên, tuyệt đối không bỏ sót file nào, không dùng thư mục `src/` và không thay đổi kiến trúc liên kết dữ liệu đã mô tả.*