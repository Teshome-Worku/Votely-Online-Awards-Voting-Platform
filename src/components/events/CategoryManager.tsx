"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/category";
import {
  createNomineeAction,
  updateNomineeAction,
  deleteNomineeAction,
} from "@/actions/nominee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Edit2,
  Layers,
  Users,
  AlertCircle,
  Loader2,
  X,
  Check,
  Lock,
  UserPlus,
} from "lucide-react";
import type { EventStatus } from "@prisma/client";

export interface SerializedNominee {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

export interface SerializedCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  nominees: SerializedNominee[];
}

interface Props {
  eventId: string;
  eventStatus: EventStatus;
  categories: SerializedCategory[];
}

export function CategoryManager({ eventId, eventStatus, categories }: Props) {
  const router = useRouter();
  const isLocked = eventStatus === "FINALIZED" || eventStatus === "ARCHIVED";
  const isLive = eventStatus === "LIVE";

  // Category creation state
  const [showAddCategory, setShowAddCategory] = React.useState(false);
  const [catName, setCatName] = React.useState("");
  const [catDesc, setCatDesc] = React.useState("");
  const [catLoading, setCatLoading] = React.useState(false);
  const [catError, setCatError] = React.useState<string | null>(null);

  // Category editing state
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null);
  const [editCatName, setEditCatName] = React.useState("");
  const [editCatDesc, setEditCatDesc] = React.useState("");

  // Nominee creation state
  const [activeAddNomineeCatId, setActiveAddNomineeCatId] = React.useState<string | null>(null);
  const [nomName, setNomName] = React.useState("");
  const [nomDesc, setNomDesc] = React.useState("");
  const [nomImage, setNomImage] = React.useState("");
  const [nomLoading, setNomLoading] = React.useState(false);
  const [nomError, setNomError] = React.useState<string | null>(null);

  // Nominee editing state
  const [editingNomId, setEditingNomId] = React.useState<string | null>(null);
  const [editNomName, setEditNomName] = React.useState("");
  const [editNomDesc, setEditNomDesc] = React.useState("");
  const [editNomImage, setEditNomImage] = React.useState("");

  // General action error
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Handle Category Add
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    setCatLoading(true);

    const formData = new FormData();
    formData.append("name", catName);
    if (catDesc) formData.append("description", catDesc);

    const res = await createCategoryAction(eventId, formData);
    if (!res.success) {
      setCatError(res.fieldErrors?.name || res.error || "Failed to create category.");
      setCatLoading(false);
      return;
    }

    setCatName("");
    setCatDesc("");
    setShowAddCategory(false);
    setCatLoading(false);
    router.refresh();
  };

  // Handle Category Update
  const handleUpdateCategory = async (categoryId: string) => {
    setActionError(null);
    const formData = new FormData();
    formData.append("name", editCatName);
    formData.append("description", editCatDesc);

    const res = await updateCategoryAction(categoryId, formData);
    if (!res.success) {
      setActionError(res.fieldErrors?.name || res.error || "Failed to update category.");
      return;
    }

    setEditingCatId(null);
    router.refresh();
  };

  // Handle Category Delete
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category and all its nominees?")) {
      return;
    }
    setActionError(null);
    const res = await deleteCategoryAction(categoryId);
    if (!res.success) {
      setActionError(res.error || "Failed to delete category.");
      return;
    }
    router.refresh();
  };

  // Handle Nominee Add
  const handleAddNominee = async (categoryId: string, e: React.FormEvent) => {
    e.preventDefault();
    setNomError(null);
    setNomLoading(true);

    const formData = new FormData();
    formData.append("name", nomName);
    if (nomDesc) formData.append("description", nomDesc);
    if (nomImage) formData.append("imageUrl", nomImage);

    const res = await createNomineeAction(eventId, categoryId, formData);
    if (!res.success) {
      setNomError(res.fieldErrors?.name || res.fieldErrors?.imageUrl || res.error || "Failed to add nominee.");
      setNomLoading(false);
      return;
    }

    setNomName("");
    setNomDesc("");
    setNomImage("");
    setActiveAddNomineeCatId(null);
    setNomLoading(false);
    router.refresh();
  };

  // Handle Nominee Update
  const handleUpdateNominee = async (nomineeId: string) => {
    setActionError(null);
    const formData = new FormData();
    formData.append("name", editNomName);
    formData.append("description", editNomDesc);
    formData.append("imageUrl", editNomImage);

    const res = await updateNomineeAction(nomineeId, formData);
    if (!res.success) {
      setActionError(res.fieldErrors?.name || res.fieldErrors?.imageUrl || res.error || "Failed to update nominee.");
      return;
    }

    setEditingNomId(null);
    router.refresh();
  };

  // Handle Nominee Delete
  const handleDeleteNominee = async (nomineeId: string) => {
    if (!confirm("Delete this nominee?")) return;
    setActionError(null);
    const res = await deleteNomineeAction(nomineeId);
    if (!res.success) {
      setActionError(res.error || "Failed to delete nominee.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header and status banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-400" />
            <span>Award Categories & Nominees</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize award categories and roster verified nominees for this competition.
          </p>
        </div>

        {!isLocked && (
          <Button
            variant="primaryGlow"
            size="sm"
            onClick={() => {
              setShowAddCategory(true);
              setCatError(null);
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </Button>
        )}
      </div>

      {isLocked && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400 shrink-0" />
          <span>This event is {eventStatus}. Categories and nominees are locked to protect final certified standings.</span>
        </div>
      )}

      {isLive && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-3 text-xs text-violet-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-violet-400 shrink-0" />
          <span>Voting is LIVE. Deletions are restricted to protect in-flight voter ballots. You can still add nominees or edit details.</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Category Form Modal/Box */}
      {showAddCategory && (
        <div className="rounded-2xl border border-violet-500/40 bg-[#0e152e] p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Create New Category</h3>
            <button
              onClick={() => setShowAddCategory(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {catError && (
            <p className="text-xs text-red-400">{catError}</p>
          )}

          <form onSubmit={handleAddCategory} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Category Name *</label>
              <Input
                type="text"
                required
                placeholder="e.g. Best Male Vocalist, Mobile App of the Year..."
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                disabled={catLoading}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
              <Input
                type="text"
                placeholder="Brief criteria for this award category..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                disabled={catLoading}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddCategory(false)}
                disabled={catLoading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primaryGlow"
                size="sm"
                disabled={catLoading}
                className="text-xs flex items-center gap-1.5"
              >
                {catLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Save Category</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0a0f20]/50 p-10 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-950/60 border border-violet-500/20 text-violet-400">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No categories configured yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Start by adding award categories (e.g., &ldquo;Artist of the Year&rdquo;) then roster your nominees.
          </p>
          {!isLocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCategory(true)}
              className="text-xs"
            >
              Add Your First Category
            </Button>
          )}
        </div>
      ) : (
        /* Categories List */
        <div className="space-y-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-3xl border border-slate-800 bg-[#0b1022] overflow-hidden shadow-xl space-y-4 p-6"
            >
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                {editingCatId === cat.id ? (
                  <div className="w-full space-y-2">
                    <Input
                      type="text"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="text-sm font-bold"
                    />
                    <Input
                      type="text"
                      placeholder="Category description..."
                      value={editCatDesc}
                      onChange={(e) => setEditCatDesc(e.target.value)}
                      className="text-xs"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="primaryGlow"
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="text-xs h-7"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCatId(null)}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {cat.nominees.length} Nominee{cat.nominees.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-slate-400 mt-1">{cat.description}</p>
                    )}
                  </div>
                )}

                {editingCatId !== cat.id && !isLocked && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setEditCatName(cat.name);
                        setEditCatDesc(cat.description || "");
                      }}
                      className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                      title="Edit Category"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    {!isLive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        title="Delete Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Nominees Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Nominees in this category
                  </span>
                  {!isLocked && activeAddNomineeCatId !== cat.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveAddNomineeCatId(cat.id);
                        setNomError(null);
                      }}
                      className="text-xs h-7 flex items-center gap-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add Nominee</span>
                    </Button>
                  )}
                </div>

                {/* Add Nominee Inline Form */}
                {activeAddNomineeCatId === cat.id && (
                  <div className="rounded-2xl border border-violet-500/40 bg-[#0e162c] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">Add Nominee to {cat.name}</h4>
                      <button
                        onClick={() => setActiveAddNomineeCatId(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {nomError && <p className="text-xs text-red-400">{nomError}</p>}

                    <form onSubmit={(e) => handleAddNominee(cat.id, e)} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          type="text"
                          required
                          placeholder="Nominee Name *"
                          value={nomName}
                          onChange={(e) => setNomName(e.target.value)}
                          disabled={nomLoading}
                          className="text-xs"
                        />
                        <Input
                          type="url"
                          placeholder="Photo URL (Optional)"
                          value={nomImage}
                          onChange={(e) => setNomImage(e.target.value)}
                          disabled={nomLoading}
                          className="text-xs"
                        />
                      </div>
                      <Input
                        type="text"
                        placeholder="Short Biography / Project Detail (Optional)"
                        value={nomDesc}
                        onChange={(e) => setNomDesc(e.target.value)}
                        disabled={nomLoading}
                        className="text-xs"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveAddNomineeCatId(null)}
                          disabled={nomLoading}
                          className="text-xs h-7"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primaryGlow"
                          size="sm"
                          disabled={nomLoading}
                          className="text-xs h-7 flex items-center gap-1"
                        >
                          {nomLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          <span>Save Nominee</span>
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Nominees Cards */}
                {cat.nominees.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No nominees added yet. Click &quot;Add Nominee&quot; above to roster participants.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {cat.nominees.map((nom) => (
                      <div
                        key={nom.id}
                        className="rounded-2xl border border-slate-800 bg-[#0d1326] p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
                      >
                        {editingNomId === nom.id ? (
                          <div className="space-y-2">
                            <Input
                              type="text"
                              value={editNomName}
                              onChange={(e) => setEditNomName(e.target.value)}
                              className="text-xs font-semibold"
                            />
                            <Input
                              type="text"
                              placeholder="Bio / description..."
                              value={editNomDesc}
                              onChange={(e) => setEditNomDesc(e.target.value)}
                              className="text-xs"
                            />
                            <Input
                              type="url"
                              placeholder="Photo URL..."
                              value={editNomImage}
                              onChange={(e) => setEditNomImage(e.target.value)}
                              className="text-xs"
                            />
                            <div className="flex items-center gap-1.5 pt-1">
                              <Button
                                size="sm"
                                variant="primaryGlow"
                                onClick={() => handleUpdateNominee(nom.id)}
                                className="text-xs h-6 px-2"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingNomId(null)}
                                className="text-xs h-6 px-2"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-3">
                              {nom.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={nom.imageUrl}
                                  alt={nom.name}
                                  className="h-10 w-10 rounded-xl object-cover border border-slate-700 shrink-0"
                                  onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                                  <Users className="h-5 w-5" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h5 className="text-sm font-semibold text-white truncate">
                                  {nom.name}
                                </h5>
                                {nom.description && (
                                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                                    {nom.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {!isLocked && (
                              <div className="flex items-center justify-end gap-1.5 pt-3 mt-2 border-t border-slate-800/60">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingNomId(nom.id);
                                    setEditNomName(nom.name);
                                    setEditNomDesc(nom.description || "");
                                    setEditNomImage(nom.imageUrl || "");
                                  }}
                                  className="h-6 px-1.5 text-xs text-slate-400 hover:text-white"
                                  title="Edit Nominee"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                {!isLive && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNominee(nom.id)}
                                    className="h-6 px-1.5 text-xs text-red-400 hover:text-red-300"
                                    title="Delete Nominee"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
