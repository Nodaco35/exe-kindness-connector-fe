# `lib_base`

Day la bo `lib` rut gon de tai su dung cho du an Next.js vua du.

Muc tieu:

- giu lai nhung helper co gia tri cao
- bo bot cac utility cu, qua dac thu, hoac kho tai su dung
- tach file theo chuc nang de de copy sang repo moi

## Cac file trong folder

- `fallBackSeo.ts`: helper tao metadata co fallback cho trang detail
- `validation.ts`: regex va validate cho form
- `string.ts`: helper xu ly chuoi/noi dung
- `format.ts`: helper format so, ten, phone
- `file.ts`: helper file upload va base64
- `object.ts`: helper trim object va parse JSON
- `useWindowSize.ts`: hook responsive don gian
- `index.ts`: barrel export

## Ghi chu

- File `fallBackSeo.ts` van giu y tuong metadata/SEO tu project hien tai de sau nay co the tu noi voi service that.
- Bo nay chua can monorepo, chua phu thuoc vao `util.js` cu.
- Neu copy sang repo moi, can kiem tra lai import `@/constants/appSetup` va `sharedMetadata` trong `fallBackSeo.ts`.
