"""Qatar seasonal, environmental, and demographic context for simulation rows.

The module intentionally keeps the bulk simulator offline and reproducible while
preserving the data contract needed to hydrate real day-wise weather later.

Production hydration candidates:

- NASA POWER Daily API:
  https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- Open-Meteo Historical Weather API:
  https://open-meteo.com/en/docs/historical-weather-api

Clinical framing sources:

- WHO heat and health:
  https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health
- WHO ambient outdoor air pollution:
  https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health
- WMO sand and dust storms:
  https://wmo.int/topics/sand-and-dust-storms
- World Bank Qatar indicators:
  https://data.worldbank.org/country/qatar

The generated fields are not diagnostic facts. They are population-level and
weather-context features for AI/ML evaluation, queue planning, and prompt
regression. Clinical disposition remains rules-first and nurse-approved.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Literal


HeatRisk = Literal["LOW", "MODERATE", "HIGH", "VERY_HIGH", "EXTREME"]
DustRisk = Literal["LOW", "MODERATE", "HIGH", "VERY_HIGH"]
RespiratorySeason = Literal["LOW", "ELEVATED", "HIGH"]


DOHA_LATITUDE = 25.2854
DOHA_LONGITUDE = 51.5310


MONTHLY_DOHA_CLIMATE = {
    # mean, max, min, relative humidity, wind, dust base
    1: (18.5, 23.0, 14.0, 68, 16, "MODERATE"),
    2: (19.5, 24.5, 15.0, 66, 17, "MODERATE"),
    3: (23.0, 29.0, 18.0, 59, 19, "HIGH"),
    4: (28.0, 35.0, 23.0, 52, 20, "HIGH"),
    5: (33.0, 40.0, 28.0, 47, 21, "HIGH"),
    6: (36.0, 42.5, 31.0, 48, 24, "VERY_HIGH"),
    7: (37.0, 43.5, 32.0, 54, 23, "VERY_HIGH"),
    8: (36.5, 42.0, 32.0, 61, 18, "HIGH"),
    9: (34.0, 39.5, 29.5, 64, 16, "MODERATE"),
    10: (30.0, 35.5, 25.5, 62, 15, "MODERATE"),
    11: (25.0, 30.0, 20.5, 64, 15, "LOW"),
    12: (20.5, 25.0, 16.0, 69, 16, "LOW"),
}


SOURCE_METADATA = {
    "climate_daily_primary": {
        "name": "NASA POWER Daily API",
        "url": "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
        "parameters": ["T2M", "T2M_MAX", "T2M_MIN", "RH2M", "WS10M", "PRECTOTCORR"],
        "note": "Use for auditable historical daily meteorological hydration by Doha coordinate.",
    },
    "climate_daily_alternative": {
        "name": "Open-Meteo Historical Weather API",
        "url": "https://open-meteo.com/en/docs/historical-weather-api",
        "parameters": [
            "temperature_2m_mean",
            "temperature_2m_max",
            "temperature_2m_min",
            "apparent_temperature_max",
            "relative_humidity_2m_mean",
            "wind_speed_10m_max",
        ],
        "note": "Use when application teams prefer ERA5-style historical weather variables.",
    },
    "health_heat": {
        "name": "WHO heat and health",
        "url": "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health",
    },
    "health_air_quality": {
        "name": "WHO ambient outdoor air pollution",
        "url": "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health",
    },
    "dust": {
        "name": "WMO sand and dust storms",
        "url": "https://wmo.int/topics/sand-and-dust-storms",
    },
    "demographics": {
        "name": "World Bank Qatar indicators",
        "url": "https://data.worldbank.org/country/qatar",
    },
}


QATAR_DEMOGRAPHIC_CONTEXT = {
    "source": "World Bank Qatar indicators plus platform synthetic workforce mix",
    "country_population_total_2025": 2_972_215,
    "life_expectancy_total_2024_years": 83,
    "population_growth_annual_percent_2025": 3.9,
    "modeling_position": (
        "Use national demographics only as population-level priors. Individual routing must come "
        "from Oracle HCM staff/dependent data, clinical facts, and deterministic safety rules."
    ),
    "health_priors_for_simulation": [
        "NCD-aware questions for diabetes, cardiovascular disease, renal vulnerability, and obesity risk.",
        "Child/dependent vulnerability to dehydration, respiratory distress, and heat exposure.",
        "Female-health workflows including pregnancy red flags and urinary symptoms.",
        "Male-health workflows including urgent genitourinary symptoms.",
        "Working-age aviation population with duty, fit-to-fly, and heat/dust exposure constraints.",
    ],
}


@dataclass(frozen=True)
class RegionalContextEngine:
    """Build day-wise contextual features for Qatar-based synthetic encounters."""

    latitude: float = DOHA_LATITUDE
    longitude: float = DOHA_LONGITUDE

    def nasa_power_url(self, start: datetime, end: datetime) -> str:
        start_key = start.strftime("%Y%m%d")
        end_key = end.strftime("%Y%m%d")
        parameters = "T2M,T2M_MAX,T2M_MIN,RH2M,WS10M,PRECTOTCORR"
        return (
            "https://power.larc.nasa.gov/api/temporal/daily/point"
            f"?parameters={parameters}&community=SB&longitude={self.longitude}"
            f"&latitude={self.latitude}&start={start_key}&end={end_key}&format=JSON"
            "&time-standard=UTC"
        )

    def open_meteo_url(self, start: datetime, end: datetime) -> str:
        daily = (
            "temperature_2m_mean,temperature_2m_max,temperature_2m_min,"
            "apparent_temperature_max,relative_humidity_2m_mean,wind_speed_10m_max,"
            "precipitation_sum"
        )
        return (
            "https://archive-api.open-meteo.com/v1/archive"
            f"?latitude={self.latitude}&longitude={self.longitude}"
            f"&start_date={start.date().isoformat()}&end_date={end.date().isoformat()}"
            f"&daily={daily}&timezone=UTC"
        )

    @staticmethod
    def _season(month: int) -> str:
        if month in {5, 6, 7, 8, 9}:
            return "hot_humid_summer"
        if month in {3, 4}:
            return "spring_dust_transition"
        if month in {10, 11}:
            return "cooling_transition"
        return "mild_winter_respiratory_season"

    @staticmethod
    def _daily_adjustment(day_of_year: int, amplitude: float) -> float:
        return round(math.sin(day_of_year * 2.399963) * amplitude, 1)

    def climate_for_day(self, occurred_at: datetime) -> Dict[str, Any]:
        value = occurred_at.astimezone(timezone.utc)
        mean_c, max_c, min_c, rh, wind_kph, dust_base = MONTHLY_DOHA_CLIMATE[value.month]
        adjustment = self._daily_adjustment(value.timetuple().tm_yday, 1.3)
        humidity_adjustment = int(self._daily_adjustment(value.timetuple().tm_yday + 13, 5))
        wind_adjustment = int(abs(self._daily_adjustment(value.timetuple().tm_yday + 29, 4)))

        mean_c = round(mean_c + adjustment, 1)
        max_c = round(max_c + adjustment + 0.4, 1)
        min_c = round(min_c + adjustment - 0.4, 1)
        rh = max(25, min(85, rh + humidity_adjustment))
        wind_kph = max(5, wind_kph + wind_adjustment)
        apparent_max_c = round(max_c + max(0, rh - 45) * 0.04 + max(0, max_c - 35) * 0.12, 1)

        heat_risk = self.heat_risk(apparent_max_c)
        dust_risk = self.dust_risk(dust_base, wind_kph, value.month)
        return {
            "date": value.date().isoformat(),
            "location": "Doha, Qatar",
            "latitude": self.latitude,
            "longitude": self.longitude,
            "source_mode": "deterministic_climatology_fallback",
            "production_hydration": {
                "nasa_power_daily_url": self.nasa_power_url(value, value),
                "open_meteo_historical_url": self.open_meteo_url(value, value),
            },
            "season": self._season(value.month),
            "temperature_mean_c": mean_c,
            "temperature_max_c": max_c,
            "temperature_min_c": min_c,
            "apparent_temperature_max_c": apparent_max_c,
            "relative_humidity_mean_percent": rh,
            "wind_speed_max_kph": wind_kph,
            "heat_risk": heat_risk,
            "dust_risk": dust_risk,
            "respiratory_season": self.respiratory_season(value.month, dust_risk),
        }

    @staticmethod
    def heat_risk(apparent_max_c: float) -> HeatRisk:
        if apparent_max_c >= 43:
            return "EXTREME"
        if apparent_max_c >= 40:
            return "VERY_HIGH"
        if apparent_max_c >= 37:
            return "HIGH"
        if apparent_max_c >= 34:
            return "MODERATE"
        return "LOW"

    @staticmethod
    def dust_risk(base: str, wind_kph: int, month: int) -> DustRisk:
        rank = {"LOW": 1, "MODERATE": 2, "HIGH": 3, "VERY_HIGH": 4}
        value = rank[base]
        if wind_kph >= 23:
            value += 1
        if month in {6, 7}:
            value += 1
        value = max(1, min(4, value))
        return {1: "LOW", 2: "MODERATE", 3: "HIGH", 4: "VERY_HIGH"}[value]  # type: ignore[return-value]

    @staticmethod
    def respiratory_season(month: int, dust_risk: DustRisk) -> RespiratorySeason:
        if dust_risk in {"HIGH", "VERY_HIGH"}:
            return "HIGH"
        if month in {12, 1, 2, 3}:
            return "ELEVATED"
        return "LOW"

    @staticmethod
    def _append_unique(target: List[str], values: Iterable[str]) -> None:
        for value in values:
            if value not in target:
                target.append(value)

    def health_context(
        self,
        climate: Dict[str, Any],
        patient_context: Dict[str, Any],
        biological_sex: str,
        patient_age_years: int,
    ) -> Dict[str, Any]:
        tags: List[str] = []
        cautions: List[str] = []
        vulnerable_groups: List[str] = []

        age_band = patient_context.get("age_band")
        context_group = patient_context.get("context_group")

        if age_band and str(age_band).startswith("child"):
            vulnerable_groups.append("child_or_dependent")
        if patient_age_years >= 60:
            vulnerable_groups.append("older_adult")
        if patient_context.get("pregnancy_status") == "reported_pregnant":
            vulnerable_groups.append("pregnancy")
        if patient_context.get("aviation_role"):
            vulnerable_groups.append("aviation_worker")

        if climate["heat_risk"] in {"HIGH", "VERY_HIGH", "EXTREME"}:
            self._append_unique(
                tags,
                ["heat_stress", "dehydration_risk", "renal_stress", "cardiovascular_load"],
            )
            cautions.append(
                "Ask about heat exposure, fluid intake, dizziness, urine output, collapse, and duty exposure before accepting a lower acuity route."
            )
        if climate["dust_risk"] in {"HIGH", "VERY_HIGH"}:
            self._append_unique(tags, ["dust_exposure", "asthma_copd_exacerbation", "allergic_rhinitis"])
            cautions.append(
                "Dust and particulate exposure should raise attention to wheeze, asthma history, chest tightness, eye irritation, and respiratory red flags."
            )
        if climate["respiratory_season"] in {"ELEVATED", "HIGH"}:
            self._append_unique(tags, ["seasonal_respiratory_context"])
        if context_group == "pediatric":
            self._append_unique(tags, ["pediatric_vulnerability", "caregiver_history_required"])
        if context_group == "female_health" or biological_sex == "FEMALE":
            self._append_unique(tags, ["female_health_context"])
        if context_group == "male_health" or biological_sex == "MALE":
            self._append_unique(tags, ["male_health_context"])

        return {
            "health_impact_tags": tags,
            "vulnerable_groups": vulnerable_groups,
            "triage_cautions": cautions,
            "demographic_priors": QATAR_DEMOGRAPHIC_CONTEXT,
            "source_metadata": SOURCE_METADATA,
        }

    def context_for(
        self,
        occurred_at: datetime,
        patient_context: Dict[str, Any],
        biological_sex: str,
        patient_age_years: int,
    ) -> Dict[str, Any]:
        climate = self.climate_for_day(occurred_at)
        health = self.health_context(climate, patient_context, biological_sex, patient_age_years)
        return {
            "climate": climate,
            "health": health,
            "usage_boundary": (
                "Context is for synthetic AI/ML evaluation and triage explanation. It must not "
                "downgrade deterministic safety floors or replace nurse assessment."
            ),
        }
