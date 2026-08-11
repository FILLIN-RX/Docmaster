import { Select } from "antd";
import {
  useLocations,
  type LocationState,
} from "../../hooks/useLocations";
import { useI18n } from "../../context/I18nContext";

interface AntdLocationSelectProps {
  value?: LocationState;
  onChange: (value: LocationState) => void;
  showArrondissement?: boolean;
}

export default function AntdLocationSelect({
  value,
  onChange,
  showArrondissement = true,
}: AntdLocationSelectProps) {
  const { t } = useI18n();
  const {
    regions,
    departments,
    arrondissements,
    region,
    department,
    arrondissement,
    loadingRegions,
    loadingDepts,
    loadingArrs,
    setRegion,
    setDepartment,
    setArrondissement,
  } = useLocations({
    initialRegion: value?.region || "",
    initialDepartment: value?.department || "",
    initialArrondissement: value?.arrondissement || "",
  });

  const emitChange = (r: string, d: string, a: string) => {
    onChange({ region: r, department: d, arrondissement: a });
  };

  const handleRegion = (val: string) => {
    setRegion(val);
    setDepartment("");
    setArrondissement("");
    emitChange(val, "", "");
  };

  const handleDepartment = (val: string) => {
    setDepartment(val);
    setArrondissement("");
    emitChange(region, val, "");
  };

  const handleArrondissement = (val: string) => {
    setArrondissement(val);
    emitChange(region, department, val);
  };

  const regionOptions = regions.map((r) => ({ value: r.region, label: r.region }));
  const deptOptions = departments.map((d) => ({ value: d.name, label: d.name }));
  const arrOptions = arrondissements.map((a) => ({ value: a, label: a }));

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#666",
    marginBottom: 4,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: showArrondissement ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <label style={labelStyle}>{t("location_region")}</label>
        <Select
          placeholder={t("location_region")}
          options={regionOptions}
          value={region || undefined}
          onChange={handleRegion}
          showSearch
          allowClear
          loading={loadingRegions}
          style={{ width: "100%" }}
          popupMatchSelectWidth={false}
          styles={{ popup: { root: { minWidth: 200, maxWidth: 400 } } }}
        />
      </div>
      <div style={{ minWidth: 0 }}>
        <label style={labelStyle}>{t("location_department")}</label>
        <Select
          placeholder={region ? t("location_department") : t("location_choose_region_first")}
          options={deptOptions}
          value={department || undefined}
          onChange={handleDepartment}
          showSearch
          allowClear
          disabled={!region}
          loading={loadingDepts}
          style={{ width: "100%" }}
          popupMatchSelectWidth={false}
          styles={{ popup: { root: { minWidth: 200, maxWidth: 400 } } }}
        />
      </div>
      {showArrondissement && (
        <div style={{ minWidth: 0 }}>
          <label style={labelStyle}>{t("location_arrondissement")}</label>
          <Select
            placeholder={department ? t("location_arrondissement") : t("location_choose_department")}
            options={arrOptions}
            value={arrondissement || undefined}
            onChange={handleArrondissement}
            showSearch
            allowClear
            disabled={!department}
            loading={loadingArrs}
            style={{ width: "100%" }}
            popupMatchSelectWidth={false}
            styles={{ popup: { root: { minWidth: 200, maxWidth: 400 } } }}
          />
        </div>
      )}
    </div>
  );
}
