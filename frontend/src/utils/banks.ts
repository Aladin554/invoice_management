import { useEffect, useState } from "react";
import api from "../api/axios";

// Fallback shown instantly while the shared list loads from the server (and
// if that request fails) — the server list is the source of truth once it
// arrives, since staff can add new banks over time via the "Other" option.
export const BANK_OPTIONS = [
  "AB Bank",
  "Agrani Bank",
  "Al-Arafah Islami Bank",
  "Bank Asia",
  "BRAC Bank",
  "City Bank",
  "Dutch-Bangla Bank",
  "Eastern Bank",
  "EXIM Bank",
  "IFIC Bank",
  "Islami Bank Bangladesh",
  "Jamuna Bank",
  "Janata Bank",
  "Mercantile Bank",
  "Midland Bank",
  "Mutual Trust Bank",
  "National Bank",
  "NCC Bank",
  "One Bank",
  "Prime Bank",
  "Pubali Bank",
  "Rupali Bank",
  "Shahjalal Islami Bank",
  "Social Islami Bank",
  "Sonali Bank",
  "Southeast Bank",
  "Standard Bank",
  "Standard Chartered Bank",
  "Trust Bank",
  "United Commercial Bank",
  "Uttara Bank",
];

/**
 * The shared bank list, plus a way to add a new one. Adding optimistically
 * appends to the in-memory list right away (so it shows up in this select
 * immediately) and persists it to the server in the background so it's
 * available everywhere else going forward.
 */
export function useBankOptions(): [string[], (name: string) => void] {
  const [banks, setBanks] = useState<string[]>(BANK_OPTIONS);

  useEffect(() => {
    api
      .get<string[]>("/banks")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) setBanks(res.data);
      })
      .catch(() => {
        // keep the fallback list
      });
  }, []);

  const addBank = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setBanks((prev) =>
      prev.some((bank) => bank.toLowerCase() === trimmed.toLowerCase())
        ? prev
        : [...prev, trimmed].sort((a, b) => a.localeCompare(b)),
    );

    api.post("/banks", { name: trimmed }).catch(() => {
      // best-effort — the bank still works for this record even if the
      // shared list couldn't be updated (e.g. offline)
    });
  };

  return [banks, addBank];
}
