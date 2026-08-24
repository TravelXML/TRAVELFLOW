import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCreateProposal } from "../../hooks/useProposals";
import { extractErrorMessage } from "../../lib/api";
import { Input } from "../common/Input";
import { Select } from "../common/Select";
import { RangeSlider } from "../common/RangeSlider";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { POPULAR_CITIES } from "../../data/cities";
import { AIRLINES } from "../../data/airlines";
import { AccommodationType, CabinClass, DietaryRestriction, HotelAmbiance, SpecialOccasion, TripPace, TripType } from "../../types";

const CITY_DATALIST_ID = "travelflow-city-suggestions";

interface FormValues {
  customerName: string;
  customerEmail: string;
  origin: string;
  destination: string;
  travelStartDate: string;
  travelEndDate: string;
  tripType: TripType;
  cabinClass: CabinClass;
  directFlightsOnly: boolean;
  airlines: Record<string, boolean>;
  numAdults: number;
  numChildren: number;
  childrenAges: number[];
  numSeniors: number;
  accommodationType: AccommodationType;
  numRooms: number;
  hotelAmbiance: HotelAmbiance;
  maxDistanceFromCenterKm: number;
  maxDistanceFromAirportKm: number;
  priceRangeMin: number;
  priceRangeMax: number;
  budget: number;
  pace: TripPace;
  specialOccasion: SpecialOccasion;
  vegetarian: boolean;
  vegan: boolean;
  halal: boolean;
  kosher: boolean;
  gluten_free: boolean;
  accessibilityNeeds: string;
  specialRequests: string;
  beach: boolean;
  food: boolean;
  adventure: boolean;
  culture: boolean;
  relaxation: boolean;
  nightlife: boolean;
  shopping: boolean;
  nature: boolean;
  wellness: boolean;
}

const PREFERENCE_OPTIONS: { key: keyof FormValues; label: string }[] = [
  { key: "beach", label: "Beach" },
  { key: "food", label: "Food & dining" },
  { key: "adventure", label: "Adventure" },
  { key: "culture", label: "Culture & history" },
  { key: "relaxation", label: "Relaxation" },
  { key: "nightlife", label: "Nightlife" },
  { key: "shopping", label: "Shopping" },
  { key: "nature", label: "Nature & wildlife" },
  { key: "wellness", label: "Wellness & spa" },
];

const DIETARY_OPTIONS: { key: DietaryRestriction; label: string }[] = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "halal", label: "Halal" },
  { key: "kosher", label: "Kosher" },
  { key: "gluten_free", label: "Gluten-free" },
];

function SectionHeading({ children }: { children: string }) {
  return <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</div>;
}

export function ProposalForm() {
  const navigate = useNavigate();
  const createProposal = useCreateProposal();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      tripType: "round_trip",
      cabinClass: "economy",
      numAdults: 1,
      numChildren: 0,
      numSeniors: 0,
      accommodationType: "mid_range",
      numRooms: 1,
      hotelAmbiance: "any",
      maxDistanceFromCenterKm: 10,
      maxDistanceFromAirportKm: 30,
      priceRangeMin: 0,
      priceRangeMax: 500,
      pace: "moderate",
      specialOccasion: "none",
    },
  });

  const numChildren = Number(watch("numChildren")) || 0;
  const maxDistanceFromCenterKm = Number(watch("maxDistanceFromCenterKm"));
  const maxDistanceFromAirportKm = Number(watch("maxDistanceFromAirportKm"));
  const priceRangeMin = Number(watch("priceRangeMin"));
  const priceRangeMax = Number(watch("priceRangeMax"));

  async function onSubmit(values: FormValues) {
    setError(null);
    const preferences = PREFERENCE_OPTIONS.filter((opt) => values[opt.key]).map((opt) => opt.label);
    const dietaryRestrictions = DIETARY_OPTIONS.filter((opt) => values[opt.key as keyof FormValues]).map((opt) => opt.key);
    const childrenAges = Array.from({ length: values.numChildren }).map((_, i) => Number(values.childrenAges?.[i] ?? 0));
    const preferredAirlines = AIRLINES.filter((airline) => values.airlines?.[airline]);

    try {
      const proposal = await createProposal.mutateAsync({
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        origin: values.origin,
        destination: values.destination,
        travelStartDate: values.travelStartDate,
        travelEndDate: values.travelEndDate,
        tripType: values.tripType,
        cabinClass: values.cabinClass,
        directFlightsOnly: values.directFlightsOnly,
        preferredAirlines,
        numAdults: Number(values.numAdults),
        numChildren: Number(values.numChildren),
        childrenAges,
        numSeniors: Number(values.numSeniors),
        accommodationType: values.accommodationType,
        numRooms: Number(values.numRooms),
        hotelAmbiance: values.hotelAmbiance,
        maxDistanceFromCenterKm: Number(values.maxDistanceFromCenterKm),
        maxDistanceFromAirportKm: Number(values.maxDistanceFromAirportKm),
        priceRangeMin: Number(values.priceRangeMin),
        priceRangeMax: Number(values.priceRangeMax),
        budget: Number(values.budget),
        pace: values.pace,
        specialOccasion: values.specialOccasion,
        dietaryRestrictions,
        accessibilityNeeds: values.accessibilityNeeds ?? "",
        specialRequests: values.specialRequests ?? "",
        preferences,
      });
      navigate(`/proposals/${proposal.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <SectionHeading>Customer</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Customer name"
              placeholder="Jane Traveler"
              error={errors.customerName?.message}
              {...register("customerName", { required: "Required" })}
            />
            <Input
              label="Customer email"
              type="email"
              placeholder="jane@example.com"
              error={errors.customerEmail?.message}
              {...register("customerEmail", { required: "Required" })}
            />
          </div>
        </div>

        <datalist id={CITY_DATALIST_ID}>
          {POPULAR_CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>

        <div className="flex flex-col gap-4">
          <SectionHeading>Route & dates</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Departure city"
              placeholder="New York, United States"
              list={CITY_DATALIST_ID}
              autoComplete="off"
              error={errors.origin?.message}
              {...register("origin", { required: "Required" })}
            />
            <Input
              label="Destination"
              placeholder="Bangkok, Thailand"
              list={CITY_DATALIST_ID}
              autoComplete="off"
              error={errors.destination?.message}
              {...register("destination", { required: "Required" })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Travel start date"
              type="date"
              error={errors.travelStartDate?.message}
              {...register("travelStartDate", { required: "Required" })}
            />
            <Input
              label="Travel end date"
              type="date"
              error={errors.travelEndDate?.message}
              {...register("travelEndDate", { required: "Required" })}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Trip type" {...register("tripType")}>
              <option value="round_trip">Round trip</option>
              <option value="one_way">One way</option>
            </Select>
            <Select label="Cabin class" {...register("cabinClass")}>
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="accent-brand" {...register("directFlightsOnly")} />
            Direct flights only
          </label>
          <div>
            <span className="text-sm font-medium text-slate-700">Preferred airlines</span>
            <div className="mt-2 flex flex-wrap gap-3">
              {AIRLINES.map((airline) => (
                <label key={airline} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                  <input type="checkbox" className="accent-brand" {...register(`airlines.${airline}` as const)} />
                  {airline}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading>Travelers</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Adults"
              type="number"
              min={0}
              error={errors.numAdults?.message}
              {...register("numAdults", { required: "Required", min: 0, valueAsNumber: true })}
            />
            <Input label="Children" type="number" min={0} {...register("numChildren", { min: 0, valueAsNumber: true })} />
            <Input label="Senior citizens" type="number" min={0} {...register("numSeniors", { min: 0, valueAsNumber: true })} />
          </div>
          {numChildren > 0 && (
            <div>
              <span className="text-sm font-medium text-slate-700">Children's ages</span>
              <div className="mt-2 grid grid-cols-4 gap-3 sm:grid-cols-6">
                {Array.from({ length: numChildren }).map((_, i) => (
                  <Input
                    key={i}
                    type="number"
                    min={0}
                    max={17}
                    placeholder={`Child ${i + 1}`}
                    {...register(`childrenAges.${i}` as const, { valueAsNumber: true, min: 0, max: 17 })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading>Accommodation</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Accommodation type" {...register("accommodationType")}>
              <option value="budget">Budget</option>
              <option value="mid_range">Mid-range</option>
              <option value="luxury">Luxury</option>
            </Select>
            <Input
              label="Number of rooms"
              type="number"
              min={1}
              error={errors.numRooms?.message}
              {...register("numRooms", { min: 1, valueAsNumber: true })}
            />
          </div>
          <Select label="Ambiance" {...register("hotelAmbiance")}>
            <option value="any">Any</option>
            <option value="romantic">Romantic</option>
            <option value="family">Family-friendly</option>
            <option value="business">Business</option>
            <option value="quiet">Quiet</option>
            <option value="lively">Lively</option>
            <option value="luxury">Luxury</option>
          </Select>
          <RangeSlider
            label="Max distance from city center"
            valueLabel={`${maxDistanceFromCenterKm} km`}
            min={0}
            max={50}
            step={1}
            {...register("maxDistanceFromCenterKm", { valueAsNumber: true })}
          />
          <RangeSlider
            label="Max distance from airport"
            valueLabel={`${maxDistanceFromAirportKm} km`}
            min={0}
            max={100}
            step={5}
            {...register("maxDistanceFromAirportKm", { valueAsNumber: true })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RangeSlider
              label="Min price per night"
              valueLabel={`$${priceRangeMin}`}
              min={0}
              max={1000}
              step={10}
              {...register("priceRangeMin", { valueAsNumber: true })}
            />
            <RangeSlider
              label="Max price per night"
              valueLabel={`$${priceRangeMax}`}
              min={0}
              max={1000}
              step={10}
              {...register("priceRangeMax", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading>Budget & pace</SectionHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Total budget (USD)"
              type="number"
              min={1}
              placeholder="2000"
              error={errors.budget?.message}
              {...register("budget", { required: "Required", min: 1, valueAsNumber: true })}
            />
            <Select label="Trip pace" {...register("pace")}>
              <option value="relaxed">Relaxed</option>
              <option value="moderate">Moderate</option>
              <option value="packed">Packed</option>
            </Select>
          </div>
          <Select label="Special occasion" {...register("specialOccasion")}>
            <option value="none">None</option>
            <option value="honeymoon">Honeymoon</option>
            <option value="anniversary">Anniversary</option>
            <option value="birthday">Birthday</option>
            <option value="family_reunion">Family reunion</option>
          </Select>
        </div>

        <div>
          <SectionHeading>Preferences</SectionHeading>
          <div className="mt-2 flex flex-wrap gap-3">
            {PREFERENCE_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                <input type="checkbox" className="accent-brand" {...register(opt.key as any)} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <SectionHeading>Dietary restrictions</SectionHeading>
          <div className="mt-2 flex flex-wrap gap-3">
            {DIETARY_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                <input type="checkbox" className="accent-brand" {...register(opt.key as keyof FormValues)} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SectionHeading>Special requirements</SectionHeading>
          <Input label="Accessibility needs" placeholder="e.g. wheelchair-accessible rooms" {...register("accessibilityNeeds")} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Special requests</label>
            <textarea
              rows={3}
              placeholder="Anything else the agent should know when building this trip"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              {...register("specialRequests")}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" isLoading={createProposal.isPending} className="w-full sm:w-auto">
          Generate proposal
        </Button>
      </form>
    </Card>
  );
}
