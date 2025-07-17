export default function AnnouncementBar() {
  const text = "🚀 This is our evolving MVP version. We’re continuously refining and improving our features. Your feedback is incredibly valuable and will directly help us grow faster. If you encounter any issues or have suggestions, please don’t hesitate to reach out. Thank you for your patience and support as we build a better platform together!";
  return (
    <div className="w-full bg-gradient-to-r from-[#FF7E5F] via-[#FEB47B] to-[#FF9966] h-10 flex items-center">
      {/* @ts-ignore */}
      <marquee
        className="w-full text-sm font-semibold text-white drop-shadow"
        behavior="scroll"
        direction="left"
        scrollamount="4"
      >
        {text}
      </marquee>
    </div>
  );
} 