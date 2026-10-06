import { useEffect, useState } from "react";
import { useGetSocialLinksQuery, useUpdateSocialLinksMutation } from "@/redux/features/allApis/socialLinksApi/socialLinksApi";

const SocialLinks = () => {
  const { data, isLoading } = useGetSocialLinksQuery();
  const [updateSocialLinks, { isLoading: isSaving }] = useUpdateSocialLinksMutation();
  const [form, setForm] = useState({ facebook: "", instagram: "", youtube: "", twitter: "", telegram: "" });

  useEffect(() => {
    if (data) {
      setForm({
        facebook: data.facebook || "",
        instagram: data.instagram || "",
        youtube: data.youtube || "",
        twitter: data.twitter || "",
        telegram: data.telegram || "",
      });
    }
  }, [data]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await updateSocialLinks(form);
    // Optionally show a toast if global toasts are used elsewhere
  };

  return (
    <div className="bg-white p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Social Media Links</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm mb-1">Facebook URL</label>
            <input name="facebook" value={form.facebook} onChange={onChange} placeholder="https://facebook.com/yourpage" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Instagram URL</label>
            <input name="instagram" value={form.instagram} onChange={onChange} placeholder="https://instagram.com/yourprofile" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">YouTube URL</label>
            <input name="youtube" value={form.youtube} onChange={onChange} placeholder="https://youtube.com/@yourchannel" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Twitter URL</label>
            <input name="twitter" value={form.twitter} onChange={onChange} placeholder="https://x.com/yourhandle" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Telegram URL</label>
            <input name="telegram" value={form.telegram} onChange={onChange} placeholder="https://t.me/yourchannel" className="w-full border rounded px-3 py-2" />
          </div>
          <button type="submit" disabled={isSaving} className={`px-5 py-2 rounded text-white ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SocialLinks;
