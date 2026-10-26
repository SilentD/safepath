import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { userAPI, EmergencyContact } from "@/services/user";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getProfile()
      .then((res: any) => {
        if (res.user?.emergencyContacts) {
          setContacts(res.user.emergencyContacts);
        }
      })
      .catch((err) => console.error("Failed to load contacts", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name || !phone) return;

  // 1. Create the new contact array by appending to existing contacts
  const newContact: EmergencyContact = { name, phone, relationship };
  const updatedList = [...contacts, newContact];

  try {
    // 2. Send the FULL UPDATED ARRAY to the API
    const response: any = await userAPI.updateContacts(updatedList);
    
    // 3. Update local state with the returned array (or updatedList)
    setContacts(response.emergencyContacts || updatedList);

    // 4. Reset form fields
    setName("");
    setPhone("");
    setRelationship("");
    
    alert("Emergency contact added successfully!");
  } catch (err: any) {
    console.error("Failed to save contact:", err);
    alert(err.message || "Failed to save contact.");
  }
};
  return (
    <AppShell eyebrow="Security" title="Trusted Contacts">
      <div className="space-y-6 pt-4">
        {/* Add Contact Form */}
        <form onSubmit={handleAddContact} className="rounded-3xl border bg-card p-6 space-y-4 shadow-sm">
          <h2 className="font-bold text-lg">Add Emergency Contact</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Contact Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number (+27...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Relationship (e.g. Family, Friend)"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow"
          >
            Save Contact
          </button>
        </form>

        {/* Contacts List */}
        <div className="space-y-3">
          <h3 className="font-bold text-md">Registered Contacts ({contacts.length})</h3>
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 rounded-2xl border bg-card">
              No emergency contacts added yet.
            </p>
          ) : (
            contacts.map((c, i) => (
              <div key={i} className="rounded-2xl border bg-card p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {c.relationship || "Contact"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}