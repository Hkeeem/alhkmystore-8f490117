import { createServerFn } from "@tanstack/react-start";

export const getAffiliateKeyStatus = createServerFn({ method: "GET" }).handler(async () => {
  const has = (name: string) => Boolean(process.env[name] && String(process.env[name]).trim().length > 0);
  return {
    amazonAccessKey: has("AMAZON_ACCESS_KEY"),
    amazonSecretKey: has("AMAZON_SECRET_KEY"),
    amazonPartnerTag: has("AMAZON_PARTNER_TAG"),
    noonAffiliateId: has("NOON_AFFILIATE_ID"),
  };
});
