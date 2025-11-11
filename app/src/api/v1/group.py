from fastapi import APIRouter, Depends, HTTPException

from app.src.db.group import GroupDB
from app.src.schemas import CreateGroupRequest, GroupResponse


router = APIRouter()


@router.post("/create")
async def create_group(
    group: CreateGroupRequest,
    group_db: GroupDB = Depends(GroupDB.get_as_dependency)
) -> GroupResponse:
    result = await group_db.create(group)
    if not result:
        raise HTTPException(status_code=500, detail="Can't create group")
    return result


@router.get("/{group_id}")
async def get_group(
    group_id: int,
    group_db: GroupDB = Depends(GroupDB.get_as_dependency)
) -> GroupResponse:
    group = await group_db.get(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group
