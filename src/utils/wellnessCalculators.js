export function calculateBmi(weightKg, heightCm) {
  const weight = Number(weightKg);
  const height = Number(heightCm) / 100;

  if (!weight || !height) {
    return null;
  }

  const bmi = weight / (height * height);
  let category = 'Healthy range';

  if (bmi < 18.5) category = 'Underweight';
  if (bmi >= 25) category = 'Overweight';
  if (bmi >= 30) category = 'Obese';

  return {
    value: Number(bmi.toFixed(1)),
    category,
  };
}

export function calculateCalories({ age, gender, weightKg, heightCm, activity }) {
  const parsedAge = Number(age);
  const weight = Number(weightKg);
  const height = Number(heightCm);
  const multiplier = Number(activity || 1.2);

  if (!parsedAge || !weight || !height) {
    return null;
  }

  const genderOffset = gender === 'female' ? -161 : 5;
  const bmr = 10 * weight + 6.25 * height - 5 * parsedAge + genderOffset;
  const maintenance = Math.round(bmr * multiplier);

  return {
    bmr: Math.round(bmr),
    maintenance,
    mildLoss: maintenance - 300,
    mildGain: maintenance + 300,
  };
}
