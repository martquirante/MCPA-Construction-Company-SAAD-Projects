import React, { useState, useEffect } from "react";
import { MapPinIcon, Building2Icon, HomeIcon } from "lucide-react";
import PhLocationCombobox from "./PhLocationCombobox";
import {
  fetchProvinces,
  fetchCitiesMunicipalities,
  fetchBarangays,
} from "../utils/psgcService";

/**
 * Administrative-Grade Philippine Cascading Address Section
 * 
 * Order of Orientation (Top-down hierarchical):
 * 1. Province / Region *
 * 2. City / Municipality * (filtered by Province)
 * 3. Barangay * (filtered by City/Municipality)
 * 4. Subdivision / Village / Phase
 * 5. Phase & Street Name
 * 6. House / Unit No. & Block / Lot No.
 * 
 * Dynamically queries public PSGC APIs directly from client. Zero backend database tables required.
 */
export default function PhAddressCascadeSection({
  province = "",
  provinceCode = "",
  onProvinceChange,
  city = "",
  cityCode = "",
  onCityChange,
  barangay = "",
  barangayCode = "",
  onBarangayChange,
  subdivision = "",
  onSubdivisionChange,
  street = "",
  onStreetChange,
  houseNo = "",
  onHouseNoChange,
  blkLot = "",
  onBlkLotChange,
  attempted = false,
  t = {},
  activeLang = "en",
  title = "Current Residential Address (Philippines)",
  isBuildSite = false,
  idPrefix = isBuildSite ? "field-build" : "field-res",
  onClearErrors,
}) {
  const [provincesList, setProvincesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);

  // 1. Initial Load: Provinces + NCR
  useEffect(() => {
    let mounted = true;
    async function loadProvs() {
      setIsLoadingProvinces(true);
      try {
        const data = await fetchProvinces();
        if (mounted) {
          setProvincesList(data);
        }
      } catch (err) {
        console.warn("Failed to load provinces:", err);
      } finally {
        if (mounted) setIsLoadingProvinces(false);
      }
    }
    loadProvs();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load Cities when provinceCode changes
  useEffect(() => {
    let mounted = true;
    if (!provinceCode) {
      setCitiesList([]);
      setBarangaysList([]);
      return;
    }

    async function loadCities() {
      setIsLoadingCities(true);
      try {
        const data = await fetchCitiesMunicipalities(provinceCode, province);
        if (mounted) {
          setCitiesList(data);
        }
      } catch (err) {
        console.warn("Failed to load cities:", err);
      } finally {
        if (mounted) setIsLoadingCities(false);
      }
    }
    loadCities();
    return () => {
      mounted = false;
    };
  }, [provinceCode, province]);

  // 3. Load Barangays when cityCode changes
  useEffect(() => {
    let mounted = true;
    if (!cityCode) {
      setBarangaysList([]);
      return;
    }

    async function loadBrgys() {
      setIsLoadingBarangays(true);
      try {
        const data = await fetchBarangays(cityCode, city);
        if (mounted) {
          setBarangaysList(data);
        }
      } catch (err) {
        console.warn("Failed to load barangays:", err);
      } finally {
        if (mounted) setIsLoadingBarangays(false);
      }
    }
    loadBrgys();
    return () => {
      mounted = false;
    };
  }, [cityCode, city]);

  const handleProvinceSelect = (item) => {
    if (onClearErrors) onClearErrors();
    onProvinceChange({ name: item.name, code: item.code, isRegion: item.isRegion });
    // Reset city and barangay when province changes
    onCityChange({ name: "", code: "" });
    onBarangayChange({ name: "", code: "" });
  };

  const handleCitySelect = (item) => {
    if (onClearErrors) onClearErrors();
    onCityChange({ name: item.name, code: item.code });
    // Reset barangay when city changes
    onBarangayChange({ name: "", code: "" });
  };

  const handleBarangaySelect = (item) => {
    if (onClearErrors) onClearErrors();
    onBarangayChange({ name: item.name, code: item.code });
  };

  return (
    <div className="space-y-2.5 pt-1 border-t border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
          <MapPinIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{title}</span>
        </label>
        <span className="text-[10px] text-neutral-400 font-mono">
          {isBuildSite ? "Project Site" : "PH Official PSGC"}
        </span>
      </div>

      {/* Orientation Hierarchy: 1. Province / Region */}
      <div>
        <PhLocationCombobox
          id={`${idPrefix}Province`}
          label={activeLang === "fil" ? "1. Probinsya / Rehiyon" : "1. Province / Region"}
          placeholder={activeLang === "fil" ? "Pumili ng Probinsya o Rehiyon..." : "Select Province or Region..."}
          searchPlaceholder={activeLang === "fil" ? "Mag-type para hanapin ang probinsya..." : "Type to search province..."}
          emptyMessage={activeLang === "fil" ? "Walang nahanap na probinsya" : "No province found"}
          value={province}
          items={provincesList}
          isLoading={isLoadingProvinces}
          disabled={isLoadingProvinces && provincesList.length === 0}
          hasError={attempted && !province}
          required={true}
          onSelect={handleProvinceSelect}
          icon={<Building2Icon className="w-3 h-3 text-amber-500/80" />}
        />
        {attempted && !province && (
          <span className="text-[11px] text-red-500 font-medium mt-1 block">
            {activeLang === "fil" ? "Kailangan pong pumili ng Probinsya / Rehiyon." : "Please select your Province / Region."}
          </span>
        )}
      </div>

      {/* Orientation Hierarchy: 2. City / Municipality & 3. Barangay */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* City / Municipality */}
        <div>
          <PhLocationCombobox
            id={`${idPrefix}City`}
            label={activeLang === "fil" ? "2. Lungsod / Bayan" : "2. City / Municipality"}
            placeholder={
              !province
                ? activeLang === "fil"
                  ? "Pumili muna ng Probinsya..."
                  : "Select Province first..."
                : activeLang === "fil"
                ? "Pumili ng Lungsod / Munisipalidad..."
                : "Select City / Municipality..."
            }
            searchPlaceholder={activeLang === "fil" ? "Hanapin ang lungsod o bayan..." : "Type to search city..."}
            emptyMessage={activeLang === "fil" ? "Walang nahanap na lungsod" : "No city/municipality found"}
            value={city}
            items={citiesList}
            isLoading={isLoadingCities}
            disabled={!provinceCode || isLoadingCities}
            hasError={attempted && !city}
            required={true}
            onSelect={handleCitySelect}
          />
          {attempted && !city && (
            <span className="text-[11px] text-red-500 font-medium mt-1 block">
              {activeLang === "fil" ? "Kailangan pong pumili ng Lungsod / Bayan." : "Please select your City / Municipality."}
            </span>
          )}
        </div>

        {/* Barangay */}
        <div>
          <PhLocationCombobox
            id={`${idPrefix}Barangay`}
            label={activeLang === "fil" ? "3. Barangay" : "3. Barangay"}
            placeholder={
              !city
                ? activeLang === "fil"
                  ? "Pumili muna ng Lungsod..."
                  : "Select City first..."
                : activeLang === "fil"
                ? "Pumili ng Barangay..."
                : "Select Barangay..."
            }
            searchPlaceholder={activeLang === "fil" ? "Hanapin ang barangay..." : "Type to search barangay..."}
            emptyMessage={activeLang === "fil" ? "Walang nahanap na barangay" : "No barangay found"}
            value={barangay}
            items={barangaysList}
            isLoading={isLoadingBarangays}
            disabled={!cityCode || isLoadingBarangays}
            hasError={attempted && !barangay}
            required={true}
            onSelect={handleBarangaySelect}
          />
          {attempted && !barangay && (
            <span className="text-[11px] text-red-500 font-medium mt-1 block">
              {activeLang === "fil" ? "Kailangan pong pumili ng Barangay." : "Please select your Barangay."}
            </span>
          )}
        </div>
      </div>

      {/* Orientation Hierarchy: 4. Subdivision / Village / Phase */}
      <div>
        <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1 truncate">
          {activeLang === "fil" ? "4. Subdivision / Village / Sitio (Kung meron)" : "4. Subdivision / Village / Sitio (Optional)"}
        </label>
        <input
          type="text"
          placeholder={t.subdivisionVillagePlaceholder || "e.g. Grand Royale Subd. or San Lorenzo Village"}
          value={subdivision}
          onChange={(e) => {
            onSubdivisionChange(e.target.value);
            if (onClearErrors) onClearErrors();
          }}
          className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500 transition-all"
        />
      </div>

      {/* Orientation Hierarchy: 5. Street & 6. House / Unit No. & Blk/Lot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1 truncate">
            {activeLang === "fil" ? "5. Kalye / Phase" : "5. Phase & Street Name"}
          </label>
          <input
            type="text"
            placeholder={t.phaseStreetPlaceholder || "e.g. Phase 2, Diamond St."}
            value={street}
            onChange={(e) => {
              onStreetChange(e.target.value);
              if (onClearErrors) onClearErrors();
            }}
            className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1 truncate">
              {activeLang === "fil" ? "House/Unit" : "House/Unit"}
            </label>
            <input
              type="text"
              placeholder="Unit 4B"
              value={houseNo}
              onChange={(e) => {
                onHouseNoChange(e.target.value);
                if (onClearErrors) onClearErrors();
              }}
              className="w-full h-10 px-2.5 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500 transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1 truncate">
              {activeLang === "fil" ? "Blk & Lot" : "Blk & Lot"}
            </label>
            <input
              type="text"
              placeholder="Blk 14 Lot 8"
              value={blkLot}
              onChange={(e) => {
                onBlkLotChange(e.target.value);
                if (onClearErrors) onClearErrors();
              }}
              className="w-full h-10 px-2.5 rounded-xl bg-neutral-50 dark:bg-[#161a23] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/15 focus:border-amber-500 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
