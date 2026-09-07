/**
 * 로그인 아이디(이름) ↔ Supabase auth 이메일 변환.
 * 한글 이름도 아이디로 쓸 수 있도록 base64url 로 인코딩한다.
 * 브라우저·서버 어디서든 동작(순수 함수).
 */

const DOMAIN = "sunbogo.local";

export function normalizeLoginId(id: string): string {
  return id.normalize("NFC").trim().replace(/\s+/g, "").toLowerCase();
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function loginIdToEmail(id: string): string {
  const norm = normalizeLoginId(id);
  if (/^[a-z0-9_]+$/.test(norm)) return `${norm}@${DOMAIN}`;
  return `u-${toBase64Url(norm)}@${DOMAIN}`;
}

/** 아이디 유효성 — 한글 2자 이상 또는 영문/숫자 4자 이상 */
export function validateLoginId(id: string): string | null {
  const t = id.normalize("NFC").trim();
  if (!t) return "이름(아이디)을 입력해 주세요";
  if (t.length > 20) return "아이디는 20자 이내로 입력해 주세요";
  if (/[가-힣]/.test(t)) {
    if (!/^[가-힣a-zA-Z0-9_·]+$/.test(t)) return "이름에는 한글·영문·숫자만 사용할 수 있어요";
    if (t.replace(/[^가-힣]/g, "").length < 2) return "한글 이름은 2자 이상이어야 해요";
    return null;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(t)) return "영문·숫자·밑줄(_)만 사용할 수 있어요";
  if (t.length < 4) return "영문/숫자 아이디는 4자 이상이어야 해요";
  return null;
}

/** 비밀번호(숫자 PIN) 유효성 — 4~8자리 숫자 */
export function validatePin(pin: string): string | null {
  if (!/^\d{4,8}$/.test(pin)) return "비밀번호는 숫자 4~8자리로 입력해 주세요";
  if (/^(\d)\1+$/.test(pin)) return "같은 숫자만 반복하는 비밀번호는 사용할 수 없어요";
  if (["1234", "0000", "1111", "123456", "12345678"].includes(pin)) return "너무 쉬운 비밀번호예요. 다른 숫자로 정해 주세요";
  return null;
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}
